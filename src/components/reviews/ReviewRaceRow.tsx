import Image from "next/image";
import Link from "next/link";
import type { PublicRace } from "@/lib/races";
import { billboardSlug, coverImage } from "@/lib/races";
import { reviewRating } from "@/lib/reviewDirectory";

export default function ReviewRaceRow({ race, className = "" }: { race: PublicRace; className?: string }) {
  return <Link href={`/review/${encodeURIComponent(billboardSlug(race))}`} className={`flex min-h-[86px] items-center gap-2 border-b border-white/10 py-[30px] ${className}`}>
    <span className="relative h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[6px] bg-white/10">{coverImage(race) ? <Image src={coverImage(race)!} alt="" fill sizes="36px" quality={65} className="object-cover" /> : null}</span>
    <span className="flex h-[36px] min-w-0 flex-1 flex-col justify-between">
      <span className="flex min-w-0 items-center justify-between gap-2">
        <span className="block min-w-0 truncate text-[20px] font-normal leading-6">{race.name}</span>
        <span className="flex shrink-0 items-center gap-2"><Image src="/reviews/star.svg" alt="" width={18} height={18} className={reviewRating(race) ? "" : "grayscale opacity-50"} /><span className={`text-[20px] font-normal ${reviewRating(race) ? "text-white" : "text-white/50"}`}>{reviewRating(race).toFixed(1)}</span><Image src="/reviews/Chevron_Right.svg" alt="" width={16} height={16} /></span>
      </span>
      <span className="text-[10px] leading-3 text-white/50">{race.event_date ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(race.event_date)) : ""}</span>
    </span>
  </Link>;
}
