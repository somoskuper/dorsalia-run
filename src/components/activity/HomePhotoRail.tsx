import { Suspense, type ReactNode } from "react";
import EventPhotoRail from "@/components/activity/EventPhotoRail";
import { EventPhotoRailSkeleton } from "@/components/ui/Skeleton";
import { eventPhotoGroups, type ActivityItem, type EventPhotoGroup } from "@/lib/activity";

/** Starts with the page request, so the rail is ready with the event cards. */
export function loadPublicEventPhotoGroups(): Promise<EventPhotoGroup[]> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return Promise.resolve([]);
  return fetch(`${base}/rest/v1/rpc/public_activity_feed`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_user_id: null, p_limit: 100, p_following_only: false }),
    next: { revalidate: 60 },
  }).then(async (response) => {
    if (!response.ok) return [];
    const data = await response.json();
    return eventPhotoGroups(Array.isArray(data) ? data as ActivityItem[] : []).slice(0, 12);
  }).catch(() => []);
}

async function Rail({ groups, className }: { groups: Promise<EventPhotoGroup[]>; className: string }) {
  return <EventPhotoRail initialGroups={await groups} className={className} />;
}

export function homePhotoSlots(): { mobile: ReactNode; desktop: ReactNode } {
  const groups = loadPublicEventPhotoGroups();
  return {
    mobile: <Suspense key="home-photos-mobile" fallback={<EventPhotoRailSkeleton />}><Rail groups={groups} className="mt-[30px]" /></Suspense>,
    desktop: <Suspense key="home-photos-desktop" fallback={<EventPhotoRailSkeleton className="" />}><Rail groups={groups} className="" /></Suspense>,
  };
}
