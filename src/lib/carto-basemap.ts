/**
 * CARTO basemaps (raster + vector GL) with optional API key.
 * Key removes watermark: ?key= on raster tiles / MVT URLs.
 */

export type CartoMapStyleId = "light" | "dark" | "streets" | "satellite"

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const STYLE_JSON: Record<"light" | "dark" | "streets", string> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
}

export type MapTileLayer = {
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string | string[]
}

export function getCartoApiKey(): string {
  try {
    // Vite (portal / editor)
    const viteKey = (import.meta as { env?: Record<string, string> }).env?.VITE_CARTO_API_KEY
    if (viteKey?.trim()) return viteKey.trim()
  } catch {
    /* not Vite */
  }
  try {
    // Next.js (sites / carreras)
    const nextKey = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CARTO_API_KEY) || ""
    if (String(nextKey).trim()) return String(nextKey).trim()
  } catch {
    /* no process */
  }
  return ""
}

function withKey(url: string, key: string): string {
  if (!key) return url
  const sep = url.includes("?") ? "&" : "?"
  return `${url}${sep}key=${encodeURIComponent(key)}`
}

export function cartoRasterUrl(stylePath: string, key = getCartoApiKey()): string {
  const url = `https://{s}.basemaps.cartocdn.com/${stylePath}/{z}/{x}/{y}{r}.png`
  return withKey(url, key)
}

export function cartoRasterLayer(stylePath: string, key = getCartoApiKey()): MapTileLayer {
  return {
    url: cartoRasterUrl(stylePath, key),
    attribution: CARTO_ATTRIBUTION,
    maxZoom: 20,
    subdomains: "abcd",
  }
}

export function buildCartoTileLayers(key = getCartoApiKey()): Record<CartoMapStyleId, MapTileLayer> {
  if (key) {
    return {
      light: cartoRasterLayer("light_nolabels", key),
      dark: cartoRasterLayer("dark_nolabels", key),
      streets: cartoRasterLayer("rastertiles/voyager_nolabels", key),
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      },
    }
  }
  // Without key CARTO watermarks — still usable for local/dev fallbacks via OSM/Esri
  return {
    light: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: "abc",
    },
    dark: cartoRasterLayer("dark_nolabels", ""),
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: "abc",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
      maxZoom: 19,
    },
  }
}

export function buildCartoLabelOverlays(key = getCartoApiKey()): Partial<Record<CartoMapStyleId, MapTileLayer>> {
  if (!key) return {}
  return {
    light: cartoRasterLayer("light_only_labels", key),
    dark: cartoRasterLayer("dark_only_labels", key),
    streets: cartoRasterLayer("rastertiles/voyager_only_labels", key),
  }
}

export function satelliteStyleObject() {
  return {
    version: 8 as const,
    sources: {
      esri: {
        type: "raster" as const,
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri",
        maxzoom: 19,
      },
    },
    layers: [{ id: "esri", type: "raster" as const, source: "esri" }],
  }
}

/** Inject API key into CARTO vector tile URLs inside a style JSON. */
async function injectCartoKeyIntoStyle(
  style: Record<string, unknown>,
  key: string,
): Promise<Record<string, unknown>> {
  if (!key) return style
  const sources = (style.sources || {}) as Record<string, Record<string, unknown>>
  for (const source of Object.values(sources)) {
    if (source.type !== "vector") continue
    if (typeof source.url === "string") {
      try {
        const tileJson = (await fetch(source.url).then((r) => r.json())) as {
          tiles?: string[]
          minzoom?: number
          maxzoom?: number
        }
        const tiles = (tileJson.tiles || []).map((t) => withKey(t, key))
        if (tiles.length) {
          delete source.url
          source.tiles = tiles
          if (tileJson.minzoom != null) source.minzoom = tileJson.minzoom
          if (tileJson.maxzoom != null) source.maxzoom = tileJson.maxzoom
        } else {
          source.url = withKey(String(source.url), key)
        }
      } catch {
        source.url = withKey(String(source.url), key)
      }
    } else if (Array.isArray(source.tiles)) {
      source.tiles = (source.tiles as string[]).map((t) => withKey(t, key))
    }
  }
  style.sources = sources
  return style
}

export async function resolveCartoMapStyle(
  mapStyle: CartoMapStyleId,
): Promise<string | Record<string, unknown>> {
  if (mapStyle === "satellite") return satelliteStyleObject()
  const url = STYLE_JSON[mapStyle === "streets" ? "streets" : mapStyle === "light" ? "light" : "dark"]
  const key = getCartoApiKey()
  try {
    const res = await fetch(url)
    if (!res.ok) return url
    const json = (await res.json()) as Record<string, unknown>
    return injectCartoKeyIntoStyle(json, key)
  } catch {
    return url
  }
}

/** @deprecated name kept for call sites — resolves CARTO styles now. */
export async function resolveOpenFreeMapStyle(
  mapStyle: CartoMapStyleId,
): Promise<string | Record<string, unknown>> {
  return resolveCartoMapStyle(mapStyle)
}

export const CARTO_MAP_ATTRIBUTION = CARTO_ATTRIBUTION
export const OPENFREEMAP_ATTRIBUTION = CARTO_ATTRIBUTION
