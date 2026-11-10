"use client";

import Link from "next/link";
import GlassPanel from "@/components/ui/GlassPanel";
import type { AthleteReview } from "@/lib/eventReviews";
import { useFollowState } from "@/lib/useFollowState";

type ProfileHighlightsProps = {
  userId: string;
  reviews: AthleteReview[];
  readOnly?: boolean;
  publicRatingCount?: number;
  showCreatorPanel?: boolean;
};

const icons = {
  followers: "/profile-highlights/Users.svg",
  reviews: "/profile-highlights/Emails-Messages.svg",
  ratings: "/profile-highlights/star.svg",
};

function countLabel(value: number) {
  return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function ProfileHighlights({ userId, reviews, readOnly = false, publicRatingCount, showCreatorPanel = false }: ProfileHighlightsProps) {
  const { followers, following, isFollowing, saving, toggleFollow, viewerId } = useFollowState(userId);
  const ownProfile = !readOnly || viewerId === userId;

  const reviewCount = reviews.filter((review) => Boolean(review.comment?.trim())).length;
  const ratingCount = readOnly ? publicRatingCount ?? 0 : reviews.filter((review) => review.entry_type === "rating" || (review.entry_type !== "review" && !review.comment?.trim())).length;
  const stats = [
    { label: "Seguidores", value: countLabel(followers), icon: icons.followers },
    { label: "Reseñas", value: countLabel(reviewCount), icon: icons.reviews },
    { label: "Ratings", value: countLabel(ratingCount), icon: icons.ratings },
  ];

  return (
    <section className="mt-5" aria-label="Datos destacados del perfil">
      <div className="grid grid-cols-3 text-center">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`min-w-0 ${index > 0 ? "border-l border-white/20" : ""}`}>
            <strong className="block text-[32px] font-bold leading-none text-white">{stat.value}</strong>
            <div className="mt-2 flex items-center justify-center gap-1 text-[13px] font-normal text-white/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stat.icon} alt="" width={12} height={12} className="h-3 w-3 opacity-50" />
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {ownProfile && showCreatorPanel ? <Link href="/creator" style={{ color: "#0E0E0E" }} className="block w-full rounded-full bg-white px-[15px] py-4 text-center text-[16px] font-bold">Panel creador</Link> : null}
        {ownProfile || isFollowing ? <GlassPanel radius={999} className="w-full" glassProps={{ glassColor: "rgba(8,8,8,0.6)", borderColor: "rgba(255,255,255,0.45)", blur: 16 }}>
          {!ownProfile ? <button type="button" disabled={saving} onClick={() => void toggleFollow()} className="block w-full px-[15px] py-4 text-center text-[16px] font-bold text-white">Siguiendo</button>
            : <Link href="/settings/edit-profile" className="block w-full px-[15px] py-4 text-center text-[16px] font-bold text-white">Editar perfil</Link>}
        </GlassPanel> : <button type="button" disabled={saving} onClick={() => void toggleFollow()} className="w-full rounded-full bg-white px-[15px] py-4 text-center text-[16px] font-bold text-[#070707]">Seguir</button>}
      </div>
      <Link href={`/seguidores/${userId}?vista=following${ownProfile ? "&origen=cuenta" : ""}`} className="mt-[10px] flex items-center justify-center gap-2 text-[16px] text-[#707070]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icons.followers} alt="" width={16} height={16} className="h-4 w-4 opacity-[0.44]" />
        <span>Siguiendo a <strong className="font-normal text-white">{countLabel(following)}</strong> personas</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile-highlights/Chevron_Right.svg" alt="" width={16} height={16} className="h-4 w-4" />
      </Link>
    </section>
  );
}
