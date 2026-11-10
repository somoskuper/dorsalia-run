const CARD_EDGE = 640;

export function portfolioCardPath(storagePath: string) {
  const match = storagePath.match(/^creators\/([^/]+)\/[^/]+\/([^/]+)\.avif$/);
  return match ? `activity/${match[1]}/cards/${match[2]}.webp` : "";
}

export function portfolioCardUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl, "http://localhost");
    const marker = "/public-image/creators/";
    const at = url.pathname.indexOf(marker);
    if (at < 0) return imageUrl;
    const [owner, , file] = url.pathname.slice(at + marker.length).split("/");
    if (!owner || !file) return imageUrl;
    url.pathname = `${url.pathname.slice(0, at)}/public-image/activity/${owner}/cards/${file.replace(/\.[^.]+$/, "")}.webp`;
    return imageUrl.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
  } catch {
    return imageUrl;
  }
}

export const portfolioCardOptions = { maxSize: CARD_EDGE, quality: 0.7 };
