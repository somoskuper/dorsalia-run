"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const PAGE_EXIT_MS = 280;

/**
 * Animate current view out, then navigate.
 * Pair with `mp-page-exit` / `mp-page-enter` CSS on the root element.
 */
export function useAnimatedNavigate(exitMs = PAGE_EXIT_MS) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);
  const busy = useRef(false);

  const navigate = useCallback(
    (href: string, method: "push" | "replace" = "push") => {
      if (busy.current) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (method === "replace") router.replace(href);
        else router.push(href);
        return;
      }
      busy.current = true;
      setExiting(true);
      window.setTimeout(() => {
        if (method === "replace") router.replace(href);
        else router.push(href);
        busy.current = false;
      }, exitMs);
    },
    [router, exitMs],
  );

  return { exiting, navigate };
}
