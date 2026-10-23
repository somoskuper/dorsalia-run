export type CalendarEvent = {
  title: string;
  startsAt: string | null | undefined;
  endsAt?: string | null;
  description?: string | null;
  location?: string | null;
  url?: string | null;
};

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function utcStamp(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "evento";
}

/** UTC lets every calendar convert the event's scheduled instant to the attendee's timezone. */
export function buildCalendarIcs(event: CalendarEvent) {
  const start = new Date(event.startsAt || "");
  if (Number.isNaN(start.getTime())) throw new Error("El evento no tiene una fecha válida.");
  const requestedEnd = event.endsAt ? new Date(event.endsAt) : null;
  const end = requestedEnd && !Number.isNaN(requestedEnd.getTime()) && requestedEnd > start ? requestedEnd : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const uid = `${slug(event.title)}-${start.getTime()}@dorsalia.run`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dorsalia//Calendario de eventos//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}`, `DTSTAMP:${utcStamp(new Date())}`, `DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`, `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "", event.location ? `LOCATION:${escapeIcs(event.location)}` : "", event.url ? `URL:${escapeIcs(event.url)}` : "", "END:VEVENT", "END:VCALENDAR", "",
  ].filter(Boolean).join("\r\n");
}

export function downloadCalendarIcs(event: CalendarEvent) {
  const blob = new Blob([buildCalendarIcs(event)], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${slug(event.title)}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
}
