export const SAVED_RACES_KEY = "dorsalia:saved-races";
export const SAVED_RACES_EVENT = "dorsalia:saved-races-changed";

export type SavedRaceEvent = {
  id: string;
  name: string;
  slug: string;
  public_subdomain: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  city: string | null;
  state?: string | null;
  sport_category?: string | null;
  venue_name?: string | null;
  country: string;
  deleted_at?: string | null;
};

export type SavedRaceRow = {
  race_event_id: string;
  created_at: string;
  race_events?: SavedRaceEvent | null;
};

export function readSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SAVED_RACES_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

export function writeSavedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_RACES_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

export function emitSavedIdsChanged(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SAVED_RACES_EVENT, { detail: { ids: [...ids] } }),
  );
  try {
    const bc = new BroadcastChannel("dorsalia-saved-races");
    bc.postMessage({ ids: [...ids] });
    bc.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function persistSavedIds(ids: Set<string>) {
  writeSavedIds(ids);
  emitSavedIdsChanged(ids);
}

/** Keep only rows whose event still exists and is not soft-deleted. */
export function isLiveSavedRow(row: SavedRaceRow): boolean {
  const ev = row.race_events;
  if (!ev?.id) return false;
  if (ev.deleted_at) return false;
  return true;
}
