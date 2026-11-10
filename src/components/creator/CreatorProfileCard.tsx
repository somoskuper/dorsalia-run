"use client";

import Link from "next/link";
import ProfileIdentity from "@/components/account/ProfileIdentity";
import CreatorSocialLinks from "@/components/creator/CreatorSocialLinks";
import GlassPanel from "@/components/ui/GlassPanel";
import { useFollowState } from "@/lib/useFollowState";

export type CreatorCard = { userId: string; username: string | null; displayName: string; avatarUrl: string | null; socialLinks: Record<string, string> };

export default function CreatorProfileCard({ creator, loginNext }: { creator: CreatorCard; loginNext: string }) {
  const { isFollowing, saving, toggleFollow, viewerId } = useFollowState(creator.userId, loginNext);
  const profileHref = creator.username ? `/perfil/${creator.username}` : undefined;
  const own = viewerId === creator.userId;
  const identity = <ProfileIdentity displayName={creator.displayName} avatarUrl={creator.avatarUrl} coverSrc="" readOnly creatorType="photographer" avatarOnly />;

  return <section className="flex flex-col items-center text-center" aria-label="Fotógrafo">
    {profileHref ? <Link href={profileHref} aria-label={`Perfil de ${creator.displayName}`}>{identity}</Link> : identity}
    {profileHref ? <Link href={profileHref} className="mt-[10px] max-w-full truncate text-[24px] font-bold leading-tight text-white">{creator.displayName}</Link> : <p className="mt-[10px] max-w-full truncate text-[24px] font-bold leading-tight text-white">{creator.displayName}</p>}
    <div className="mt-[2px] flex max-w-full items-center justify-center gap-2">
      {creator.username ? <p className="truncate text-[16px] font-medium text-white/60">@{creator.username}</p> : null}
      {own ? null : isFollowing ? <GlassPanel radius={999} className="shrink-0" style={{ height: 28 }} glassProps={{ glassColor: "rgba(8,8,8,0.6)", borderColor: "rgba(255,255,255,0.45)", blur: 16 }}>
        <button type="button" disabled={saving} onClick={() => void toggleFollow()} className="h-7 px-2.5 text-[12px] font-semibold text-white">Siguiendo</button>
      </GlassPanel> : <button type="button" disabled={saving} onClick={() => void toggleFollow()} className="h-7 shrink-0 rounded-full bg-white px-2.5 text-[12px] font-semibold" style={{ color: "#070707" }}>Seguir</button>}
    </div>
    <CreatorSocialLinks links={creator.socialLinks} className="mt-5" />
  </section>;
}
