"use client";

import { useEffect, useState } from "react";

export type EventPaths = Record<string, string>;

let cachedPaths: EventPaths | null = null;
let pendingPaths: Promise<EventPaths> | null = null;

function loadPaths(): Promise<EventPaths> {
  if (cachedPaths) return Promise.resolve(cachedPaths);
  if (!pendingPaths) {
    pendingPaths = fetch("/api/public-event-links")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los enlaces de eventos");
        return response.json() as Promise<EventPaths>;
      })
      .then((paths) => {
        cachedPaths = paths;
        return paths;
      })
      .finally(() => { pendingPaths = null; });
  }
  return pendingPaths;
}

export function usePublicEventPaths(): EventPaths | null {
  const [paths, setPaths] = useState<EventPaths | null>(cachedPaths);

  useEffect(() => {
    let active = true;
    void loadPaths().then((value) => { if (active) setPaths(value); }).catch(() => {});
    return () => { active = false; };
  }, []);

  return paths;
}

export function publicEventPath(paths: EventPaths | null, key: string | null | undefined): string | undefined {
  return key ? paths?.[key.toLowerCase()] : undefined;
}
