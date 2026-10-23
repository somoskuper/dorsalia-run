"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import OrganizerFollowButton from "@/components/account/OrganizerFollowButton";
import GlassIconButton from "@/components/account/GlassIconButton";
import AssetIcon from "@/components/ui/AssetIcon";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import type { PublicOrganizer, PublicRace } from "@/lib/races";
import {
  marketplaceEventPath,
  cardCoverImage,
  formatDate,
  formatMinPrice,
  isFinalized,
  placeLabel,
} from "@/lib/races";

const ICON_BACK = "/assetsdev/Chevron_Right.svg";
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run";

const ORG_TYPE_LABELS: Record<string, string> = {
  club: "Club o asociación",
  ayuntamiento: "Ayuntamiento / gobierno",
  empresa: "Empresa",
  persona: "Organizador independiente",
};

function VerifiedBadge({ level }: { level: "claimed" | "dorsalia" }) {
  const dorsalia = level === "dorsalia";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
        dorsalia
          ? "border-[#c9f24b]/35 bg-[#c9f24b]/10 text-[#c9f24b]"
          : "border-white/15 bg-white/[0.05] text-white/45"
      }`}
      title={dorsalia ? "Organizador con eventos y cobros activos en Dorsalia" : "Perfil reclamado por su organizador"}
    >
      <AssetIcon name={dorsalia ? "Verify-solid" : "Verify-stroke"} size={16} />
      Verificado
    </span>
  );
}

function externalUrl(raw: string | null | undefined): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export type OrganizerSocialLink = {
  key: string;
  url: string;
  icon: string;
};

type Props = {
  organizer: PublicOrganizer;
  events: PublicRace[];
  eventPaths: Record<string, string>;
  coverSrc: string;
  socials: OrganizerSocialLink[];
};

export default function OrganizerProfileView({
  organizer,
  events,
  eventPaths,
  coverSrc,
  socials,
}: Props) {
  const router = useRouter();
  const initials = organizer.name.slice(0, 1).toUpperCase() || "O";
  const bio =
    String(organizer.description || organizer.support_text || "").trim() || null;
  const website = externalUrl(organizer.site_url);
  const orgType = organizer.org_type ? ORG_TYPE_LABELS[organizer.org_type] || organizer.org_type : null;

  return (
    <div className="min-h-screen bg-[#070707] pb-24 text-white md:pb-16">
      <div className="relative h-[221px] w-full">
        <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.01] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-[#070707]" />
        </div>

        <div className="absolute inset-x-0 top-0 z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-4 sm:px-8">
          <GlassIconButton aria-label="Volver" onClick={() => router.push("/")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_BACK} alt="" width={24} height={24} />
          </GlassIconButton>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-50 mx-auto max-w-6xl translate-y-1/2 px-5 sm:px-8">
          <div className="h-[140px] w-[140px] overflow-hidden rounded-full border-4 border-[#070707] bg-neutral-900 shadow-2xl">
          {organizer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organizer.logo_url}
              alt=""
              width={140}
              height={140}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-neutral-800 font-akira text-4xl text-white">
              {initials}
            </div>
          )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="grid gap-8">
          <div>
            <div className="mt-1 flex max-w-full flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="min-w-0 max-w-full break-words font-sans text-[clamp(2rem,8vw,3.5rem)] font-extrabold leading-[1.08] text-white [overflow-wrap:anywhere]">
                {organizer.name}
              </h1>
              {organizer.verification_level ? <VerifiedBadge level={organizer.verification_level} /> : null}
            </div>
            <p className="mt-2 text-[16px] font-medium text-white/45">Organizador en Dorsalia</p>
            <p className={`mt-5 max-w-3xl whitespace-pre-line text-[17px] leading-7 sm:text-lg ${bio ? "text-white/75" : "text-white/40"}`}>
              {bio || "Organizador en Dorsalia."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
              {organizer.place ? <span>{organizer.place}</span> : null}
              {orgType ? <span>{orgType}</span> : null}
            </div>

            <OrganizerFollowButton workspaceId={organizer.id} slug={organizer.slug} />
            {organizer.is_provisional ? (
              <Link href={`${PORTAL_URL}/reclamar-organizador?workspaceId=${encodeURIComponent(organizer.id)}`} style={{ color: '#000' }} className="mt-6 inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#c9f24b] px-8 py-4 text-base font-extrabold text-black transition hover:bg-[#d8ff5b]">
                Reclamar perfil
              </Link>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {website ? (
                <PrimaryButton href={website} external>
                  Visitar sitio web
                </PrimaryButton>
              ) : null}
              {organizer.contact_email ? (
                <SecondaryButton href={`mailto:${organizer.contact_email}`}>
                  Contactar
                </SecondaryButton>
              ) : null}
            </div>

            {socials.length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center gap-2">
            {socials.map((s) => (
              <a
                key={`${s.key}-${s.url}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.key}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] opacity-85 transition-all hover:border-white/25 hover:bg-white/[0.1] hover:opacity-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" width={24} height={24} className="h-6 w-6" />
              </a>
            ))}
              </div>
            ) : null}
          </div>

        </div>

        <section className="mt-10 border-t border-white/10 pt-6 sm:mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Cartelera</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Sus eventos</h2>
          </div>
          <p className="text-sm text-white/35">{events.length} en total</p>
        </div>
        {events.length === 0 ? (
          <p className="mt-4 text-[14px] text-white/40">
            Aún no hay carreras publicadas en la cartelera.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {events.map((race) => {
              const img = cardCoverImage(race);
              const done = isFinalized(race);
              const href = eventPaths[race.id] || marketplaceEventPath(race);
              return (
                <Link
                  key={race.id}
                  href={href}
                  className="group flex gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-3 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.065]"
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="h-28 w-24 shrink-0 rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-28 w-24 shrink-0 rounded-[18px] bg-white/10" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col py-1">
                    <p className="line-clamp-2 text-base font-semibold text-white">
                      {race.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/45">
                      {formatDate(race.event_date)}
                      {placeLabel(race) ? ` · ${placeLabel(race)}` : ""}
                    </p>
                    <p className="mt-auto text-[13px] font-medium text-white/65">
                      {done ? "Finalizado" : formatMinPrice(race)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {organizer.team && organizer.team.length > 0 ? (
          <section className="mt-14 border-t border-white/10 pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Personas</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Equipo organizador</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {organizer.team.map((member) => (
                <div key={member.id} className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 pr-5">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-sm font-bold text-white/70">{member.name.slice(0, 1).toUpperCase()}</div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                    <p className="mt-0.5 text-xs capitalize text-white/40">{member.role || "Organizador"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        </section>
      </main>
    </div>
  );
}
