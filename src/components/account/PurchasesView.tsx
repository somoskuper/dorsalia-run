"use client";

import AccountSubpageHeader from "@/components/account/AccountSubpageHeader";
import GlassPanel from "@/components/ui/GlassPanel";

export type PurchaseTicketInfo = {
  folio: string;
  nombre: string;
  distancia: string;
  talla: string;
  dorsal: string | null;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  courtesy: boolean;
  qrSrc: string;
  downloadHref: string | null;
};

export type PurchaseListItem = {
  id: string;
  eventTitle: string;
  purchaseAt: string | null;
  priceLabel: string;
  statusLabel: string;
  organizerLogo: string | null;
  organizerName: string | null;
  coverUrl: string | null;
  eventDate: string | null;
  city: string | null;
  country: string | null;
  eventHref: string | null;
  ticket: PurchaseTicketInfo | null;
};

type ListProps = {
  items: PurchaseListItem[];
  onOpen: (item: PurchaseListItem) => void;
};

type SummaryProps = {
  item: PurchaseListItem;
  onBack: () => void;
};

function formatPurchaseAt(iso: string | null): string {
  if (!iso) return "Fecha no disponible";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Fecha no disponible";
  }
}

function formatEventWhen(iso: string | null): { line1: string; line2: string } {
  if (!iso) return { line1: "Fecha por confirmar", line2: "" };
  try {
    const d = new Date(iso);
    const line1 = d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    const line2 = d.toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return {
      line1: line1.charAt(0).toUpperCase() + line1.slice(1),
      line2,
    };
  } catch {
    return { line1: "Fecha por confirmar", line2: "" };
  }
}

export function PurchasesList({ items, onOpen }: ListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 py-12 text-center text-sm text-white/40">
        Aún no hay compras. Explora la cartelera y consigue tu dorsal.
      </p>
    );
  }

  return (
    <ul className="flex flex-col" style={{ gap: 18 }}>
      {items.map((item) => {
        const initial = (item.organizerName || item.eventTitle).slice(0, 1).toUpperCase();
        const isPending = item.statusLabel !== "Pago exitoso";
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center text-left"
              style={{ gap: 12 }}
            >
              <span
                className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/10"
                style={{ width: 40, height: 40 }}
              >
                {item.organizerLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.organizerLogo}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <span className="text-[13px] font-bold text-white/70">{initial}</span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold leading-tight text-white">
                  {item.eventTitle}
                </span>
                <span
                  className="mt-0.5 block truncate text-[10px] leading-tight"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {formatPurchaseAt(item.purchaseAt)}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span
                  className="block text-[10px] leading-tight"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {item.priceLabel === "Gratis" || isPending
                    ? "Estado"
                    : "Precio"}
                </span>
                <span className="mt-0.5 block text-[14px] font-bold leading-tight text-white">
                  {isPending
                    ? item.statusLabel
                    : item.priceLabel}
                </span>
                {item.statusLabel === "Pago exitoso" && item.priceLabel !== "Gratis" ? (
                  <span
                    className="mt-0.5 block text-[10px] leading-tight"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {item.statusLabel}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PurchaseSummary({ item, onBack }: SummaryProps) {
  const when = formatEventWhen(item.eventDate);
  const place = [item.city, item.country].filter(Boolean).join(", ") || "México";
  const orgName = item.organizerName || "Organizador";
  const initial = orgName.slice(0, 1).toUpperCase();
  const ticket = item.ticket;
  const showTicket = Boolean(ticket && item.statusLabel === "Pago exitoso");
  const isPending = item.statusLabel !== "Pago exitoso";

  return (
    <section className="min-h-screen bg-[#070707] pb-8">
      <AccountSubpageHeader title="Resumen" onBack={onBack} />

      <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 24 }}>
        <div className="flex items-start" style={{ gap: 14 }}>
          <div
            className="relative shrink-0 overflow-hidden bg-white/5"
            style={{ width: 110, height: 138, borderRadius: 28 }}
          >
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center px-2 text-center font-akira text-[11px] text-white/35">
                {item.eventTitle}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-bold leading-snug text-white">{item.eventTitle}</h2>
                <p
                  className="mt-1 text-[10px] leading-tight"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {formatPurchaseAt(item.purchaseAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {isPending ? "Estado" : "Precio"}
                </p>
                <p className="mt-0.5 text-[16px] font-bold leading-tight text-white">
                  {isPending ? item.statusLabel : item.priceLabel}
                </p>
                {item.statusLabel === "Pago exitoso" ? (
                  <p
                    className="mt-0.5 text-[10px] leading-tight"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {item.statusLabel}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-white">
              <CalendarIcon />
              <div className="min-w-0 text-[13px] leading-snug">
                <p className="capitalize">{when.line1}</p>
                {when.line2 ? <p>{when.line2}</p> : null}
              </div>
            </div>

            <div className="mt-2.5 flex items-start gap-2 text-white">
              <PinIcon />
              <p className="min-w-0 text-[13px] leading-snug">{place}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center" style={{ gap: 10 }}>
          <span
            className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/10"
            style={{ width: 28, height: 28 }}
          >
            {item.organizerLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.organizerLogo}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-white/70">{initial}</span>
            )}
          </span>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Presentado por{" "}
            <span className="font-semibold text-white">{orgName}</span>
          </p>
        </div>

        {showTicket && ticket ? (
          <div
            className="mt-8 overflow-hidden rounded-[20px] border border-white/12 bg-white/[0.04]"
            style={{ padding: 18 }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Tu acceso
            </p>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-4">
                {ticket.courtesy ? (
                  <span className="inline-flex rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    Cortesía
                  </span>
                ) : null}

                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Corredor
                  </p>
                  <p className="mt-1 truncate text-[17px] font-bold text-white">{ticket.nombre}</p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Folio
                    </dt>
                    <dd className="mt-1 font-mono font-semibold text-white">{ticket.folio}</dd>
                  </div>
                  {ticket.dorsal ? (
                    <div>
                      <dt
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Dorsal
                      </dt>
                      <dd className="mt-1 font-mono font-semibold text-white">#{ticket.dorsal}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Modalidad
                    </dt>
                    <dd className="mt-1 font-semibold text-white">{ticket.distancia}</dd>
                  </div>
                  <div>
                    <dt
                      className="text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      Talla
                    </dt>
                    <dd className="mt-1 font-semibold text-white">{ticket.talla}</dd>
                  </div>
                  {ticket.fecha ? (
                    <div>
                      <dt
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Fecha
                      </dt>
                      <dd className="mt-1 font-semibold text-white">{ticket.fecha}</dd>
                    </div>
                  ) : null}
                  {ticket.hora ? (
                    <div>
                      <dt
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Hora
                      </dt>
                      <dd className="mt-1 font-semibold text-white">{ticket.hora}</dd>
                    </div>
                  ) : null}
                  {ticket.lugar ? (
                    <div className="col-span-2">
                      <dt
                        className="text-[11px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Lugar
                      </dt>
                      <dd className="mt-1 font-semibold text-white">{ticket.lugar}</dd>
                    </div>
                  ) : null}
                </dl>

                {ticket.downloadHref ? (
                  <a
                    href={ticket.downloadHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-[13px] font-bold text-black transition-opacity hover:opacity-90"
                  >
                    Descargar boleto PDF
                  </a>
                ) : null}
              </div>

              <div className="mx-auto flex shrink-0 flex-col items-center sm:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.qrSrc}
                  alt={`QR de acceso ${ticket.folio}`}
                  className="h-[148px] w-[148px] rounded-xl border border-white/15 bg-white p-2"
                />
                <p
                  className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  QR de acceso
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {item.eventHref ? (
          <div className="mt-8 w-full">
            <GlassPanel
              radius={20}
              style={{ width: "100%" }}
              glassProps={{
                glassColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.18)",
                blur: 16,
                frost: 0,
                saturation: 120,
                aberrationIntensity: 0.02,
              }}
            >
              <a
                href={item.eventHref}
                target="_blank"
                rel="noreferrer"
                className="ds-btn ds-btn--secondary ds-btn--full relative z-[1] border-0 bg-transparent"
                style={{ background: "transparent" }}
              >
                Ver evento
              </a>
            </GlassPanel>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <path
        d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
