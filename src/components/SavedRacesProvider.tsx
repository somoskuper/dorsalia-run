"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  SAVED_RACES_EVENT,
  isLiveSavedRow,
  persistSavedIds,
  readSavedIds,
  type SavedRaceRow,
} from "@/lib/savedRaces";

type SavedRacesApi = {
  ready: boolean;
  savedIds: Set<string>;
  items: SavedRaceRow[];
  isSaved: (raceEventId: string) => boolean;
  toggleSave: (raceEventId: string) => Promise<boolean>;
  removeSaved: (raceEventId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<SavedRacesApi>({
  ready: false,
  savedIds: new Set(),
  items: [],
  isSaved: () => false,
  toggleSave: async () => false,
  removeSaved: async () => false,
  refresh: async () => {},
});

const SELECT =
  "race_event_id, created_at, race_events(id, name, slug, public_subdomain, cover_image_url, event_date, city, state, country, sport_category, deleted_at)";

export default function SavedRacesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAthleteAuth();
  const [ready, setReady] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [items, setItems] = useState<SavedRaceRow[]>([]);

  const applyIds = useCallback((ids: Set<string>) => {
    setSavedIds(new Set(ids));
    persistSavedIds(ids);
  }, []);

  const pruneRemoteOrphans = useCallback(
    async (rows: SavedRaceRow[]) => {
      if (!user) return rows.filter(isLiveSavedRow);
      const dead = rows.filter((r) => !isLiveSavedRow(r)).map((r) => r.race_event_id);
      const live = rows.filter(isLiveSavedRow);
      if (dead.length === 0) return live;
      const supabase = createClient();
      await supabase
        .from("athlete_saved_races")
        .delete()
        .eq("user_id", user.id)
        .in("race_event_id", dead);
      return live;
    },
    [user],
  );

  const refresh = useCallback(async () => {
    const local = readSavedIds();

    if (!user) {
      setItems([]);
      setSavedIds(local);
      setReady(true);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("athlete_saved_races")
      .select(SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[saved-races]", error.message);
      setSavedIds(local);
      setItems([]);
      setReady(true);
      return;
    }

    const raw = (data || []) as unknown as SavedRaceRow[];
    const live = await pruneRemoteOrphans(raw);
    const remoteIds = new Set(live.map((r) => r.race_event_id));

    // Sync local-only hearts that still look valid (event id present remotely after upsert attempt).
    const localOnly = [...local].filter((id) => !remoteIds.has(id));
    for (const id of localOnly) {
      const { error: upErr } = await supabase.from("athlete_saved_races").upsert(
        { user_id: user.id, race_event_id: id },
        { onConflict: "user_id,race_event_id" },
      );
      if (upErr) {
        // Gone / soft-deleted / RLS — drop from local.
        local.delete(id);
      } else {
        remoteIds.add(id);
      }
    }

    // Re-fetch details if we pushed any local hearts.
    let nextItems = live;
    if (localOnly.length > 0) {
      const { data: again } = await supabase
        .from("athlete_saved_races")
        .select(SELECT)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      nextItems = await pruneRemoteOrphans((again || []) as unknown as SavedRaceRow[]);
    }

    const nextIds = new Set(nextItems.map((r) => r.race_event_id));
    setItems(nextItems);
    applyIds(nextIds);
    setReady(true);
  }, [user, applyIds, pruneRemoteOrphans]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  useEffect(() => {
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent<{ ids?: string[] }>).detail;
      if (!detail?.ids) return;
      setSavedIds(new Set(detail.ids));
    };
    window.addEventListener(SAVED_RACES_EVENT, onLocal);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("dorsalia-saved-races");
      bc.onmessage = (msg) => {
        const ids = (msg.data as { ids?: string[] } | null)?.ids;
        if (Array.isArray(ids)) setSavedIds(new Set(ids.map(String)));
      };
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener(SAVED_RACES_EVENT, onLocal);
      bc?.close();
    };
  }, []);

  const removeSaved = useCallback(
    async (raceEventId: string) => {
      const id = String(raceEventId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        persistSavedIds(next);
        return next;
      });
      setItems((prev) => prev.filter((r) => r.race_event_id !== id));

      if (user) {
        const supabase = createClient();
        const { error } = await supabase
          .from("athlete_saved_races")
          .delete()
          .eq("user_id", user.id)
          .eq("race_event_id", id);
        if (error) {
          console.error("[saved-races] delete", error.message);
          await refresh();
          return false;
        }
      }
      return true;
    },
    [user, refresh],
  );

  const toggleSave = useCallback(
    async (raceEventId: string) => {
      const id = String(raceEventId);
      const removing = savedIds.has(id);

      if (removing) {
        return removeSaved(id);
      }

      // Optimistic add
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        persistSavedIds(next);
        return next;
      });

      if (!user) return true;

      const supabase = createClient();
      const { error } = await supabase.from("athlete_saved_races").upsert(
        { user_id: user.id, race_event_id: id },
        { onConflict: "user_id,race_event_id" },
      );

      if (error) {
        console.error("[saved-races] upsert", error.message);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          persistSavedIds(next);
          return next;
        });
        return false;
      }

      // Refresh list so /cuenta picks up cover/name without a full page reload.
      const { data } = await supabase
        .from("athlete_saved_races")
        .select(SELECT)
        .eq("user_id", user.id)
        .eq("race_event_id", id)
        .maybeSingle();
      if (data && isLiveSavedRow(data as unknown as SavedRaceRow)) {
        setItems((prev) => {
          const without = prev.filter((r) => r.race_event_id !== id);
          return [data as unknown as SavedRaceRow, ...without];
        });
      } else {
        // Event soft-deleted or invisible — undo.
        await removeSaved(id);
        return false;
      }
      return true;
    },
    [savedIds, user, removeSaved],
  );

  const value = useMemo<SavedRacesApi>(
    () => ({
      ready,
      savedIds,
      items,
      isSaved: (id: string) => savedIds.has(String(id)),
      toggleSave,
      removeSaved,
      refresh,
    }),
    [ready, savedIds, items, toggleSave, removeSaved, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSavedRaces() {
  return useContext(Ctx);
}
