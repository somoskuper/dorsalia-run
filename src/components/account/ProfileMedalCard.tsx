"use client";

import Link from "next/link";
import type { ProfileMedal } from "@/components/account/AccountProfileView";

export default function ProfileMedalCard({ medals, ownProfile, onOpen }: { medals: ProfileMedal[]; ownProfile: boolean; onOpen: () => void }) {
  if (!ownProfile && medals.length === 0) return null;
  return <section className="mt-10 rounded-[20px] bg-[#191919] px-[15px] py-[20px]" aria-label="Records personales">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[20px] font-semibold text-white">Records personales</h2>
      {ownProfile ? <Link href="/settings/edit-profile/medals" aria-label="Editar medallas destacadas" className="grid h-8 w-8 place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/profile-highlights/edit.svg" alt="" width={16} height={16} className="h-4 w-4" />
      </Link> : <button type="button" onClick={onOpen} aria-label="Ver todos los retos" className="grid h-8 w-8 place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/Chevron_Right.svg" alt="" width={16} height={16} className="h-4 w-4" />
      </button>}
    </div>
    {medals.length ? <div className="mt-[15px] grid grid-cols-3 gap-[10px]">
      {medals.slice(0, 3).map((medal) => <div key={medal.key} className="aspect-square" title={medal.label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={medal.imageUrl} alt={medal.label} className="h-full w-full object-contain" style={{ opacity: medal.completed ? 1 : 0.5 }} />
      </div>)}
    </div> : <p className="mt-[15px] text-[14px] text-white/50">Aún no hay medallas para mostrar.</p>}
  </section>;
}
