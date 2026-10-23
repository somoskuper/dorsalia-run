"use client";

import Link from "next/link";
import type { SavedRaceRow } from "@/lib/savedRaces";
import { eventMatchesResidence } from "@/lib/mxStates";
import { marketplaceEventPath } from "@/lib/races";

const CARD_W = 134;
const CARD_H = 167;
const CARD_RADIUS = 28;
const CARD_GAP = 10;
const SIDE_PAD = 20;
const TITLE_TO_CARDS = 10;
const BLOCK_GAP = 23;

export type SavedCarouselItem = {
  id: string;
  name: string;
  href: string;
  coverUrl: string | null;
  eventDate: string | null;
  city: string | null;
};

type Props = {
  items: SavedRaceRow[];
  residence: string | null;
  ready: boolean;
};

function toItem(row: SavedRaceRow): SavedCarouselItem | null {
  const ev = row.race_events;
  if (!ev?.id) return null;
  const href = ev.public_subdomain || ev.slug ? marketplaceEventPath(ev) : "/";
  return {
    id: ev.id,
    name: ev.name || "Carrera",
    href,
    coverUrl: ev.cover_image_url,
    eventDate: ev.event_date,
    city: ev.city,
  };
}

function eventTime(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export default function SavedRacesView({ items, residence, ready: _ready }: Props) {
  const now = Date.now();
  const mapped = items.map(toItem).filter((x): x is SavedCarouselItem => Boolean(x));

  const proximos = [...mapped]
    .filter((m) => {
      const t = eventTime(m.eventDate);
      return t >= now - 12 * 60 * 60 * 1000; // include events from ~today
    })
    .sort((a, b) => eventTime(a.eventDate) - eventTime(b.eventDate));

  const cerca = [...mapped]
    .filter((m) => {
      const row = items.find((r) => r.race_events?.id === m.id);
      const ev = row?.race_events;
      return eventMatchesResidence(
        [ev?.city, ev?.venue_name, ev?.country, m.city],
        residence,
      );
    })
    .sort((a, b) => eventTime(a.eventDate) - eventTime(b.eventDate));

  // If residence set but no matches, still show empty section with hint.
  // If no residence, show hint instead of guessing.

  return (
    <div className="bg-[#070707]" style={{ paddingBottom: 32 }}>
      {mapped.length === 0 ? (
        <p
          className="rounded-2xl border border-dashed border-white/15 py-12 text-center text-sm text-white/40"
          style={{ marginLeft: SIDE_PAD, marginRight: SIDE_PAD, marginTop: 24 }}
        >
          Guarda carreras con el corazón en la cartelera.
        </p>
      ) : (
        <>
          <CarouselBlock title="Proximos" items={proximos} empty="No hay próximos guardados." />
          <div style={{ height: BLOCK_GAP }} />
          <CarouselBlock
            title="Cerca de ti"
            items={cerca}
            empty={
              residence
                ? `No hay guardados cerca de ${residence}.`
                : "Elige tu residencia en Editar perfil para ver eventos cerca de ti."
            }
          />
        </>
      )}
    </div>
  );
}

function CarouselBlock({
  title,
  items,
  empty,
}: {
  title: string;
  items: SavedCarouselItem[];
  empty: string;
}) {
  return (
    <section>
      <h2
        className="font-bold text-white"
        style={{
          fontSize: 22,
          lineHeight: 1.1,
          paddingLeft: SIDE_PAD,
          paddingRight: SIDE_PAD,
        }}
      >
        {title}
      </h2>
      {items.length === 0 ? (
        <p
          className="text-[13px] text-white/40"
          style={{ marginTop: TITLE_TO_CARDS, paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD }}
        >
          {empty}
        </p>
      ) : (
        <div
          className="flex overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            marginTop: TITLE_TO_CARDS,
            gap: CARD_GAP,
            paddingLeft: SIDE_PAD,
            paddingRight: SIDE_PAD,
          }}
        >
          {items.map((item) => (
            <SavedPosterCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function SavedPosterCard({ item }: { item: SavedCarouselItem }) {
  return (
    <Link
      href={item.href}
      className="relative shrink-0 overflow-hidden bg-white/5"
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: CARD_RADIUS,
      }}
      aria-label={item.name}
    >
      {item.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center px-2 text-center font-akira text-[11px] text-white/35">
          {item.name}
        </span>
      )}
    </Link>
  );
}
