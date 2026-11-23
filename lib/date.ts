import type { Wedding } from "./wedding";

export const weddingDate = (w: Wedding) => new Date(w.dateISO);

// Month/day/year as they appear in the wedding's own timezone (taken from the ISO string, not the viewer's clock).
export function weddingParts(w: Wedding) {
  const [y, m, d] = w.dateISO.slice(0, 10).split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export const weekdayOf = (w: Wedding) =>
  new Date(w.dateISO).toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Manila" });

const pad = (n: number) => String(n).padStart(2, "0");
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

function eventRange(w: Wedding) {
  const start = new Date(weddingDate(w).getTime() - 30 * 60 * 1000); // call time: 30 min before ceremony
  const end = new Date(weddingDate(w).getTime() + 8 * 60 * 60 * 1000);
  return { start, end };
}

const eventTitle = (w: Wedding) => `${w.groom} & ${w.bride}'s Wedding`;
const eventDetails = (w: Wedding) =>
  `Ceremony: ${w.ceremony.name}, ${w.ceremony.address} (${w.ceremony.time})\nReception: ${w.reception.name}${w.reception.address ? ", " + w.reception.address : ""} (${w.reception.time})`;

export function googleCalendarUrl(w: Wedding) {
  const { start, end } = eventRange(w);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(w),
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: eventDetails(w),
    location: `${w.ceremony.name}, ${w.ceremony.address}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function downloadIcs(w: Wedding) {
  const { start, end } = eventRange(w);
  const esc = (s: string) => s.replace(/[,;\\]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//wedding//invite//EN", "BEGIN:VEVENT",
    `UID:${utcStamp(start)}-wedding@invite`, `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`,
    `SUMMARY:${esc(eventTitle(w))}`, `DESCRIPTION:${esc(eventDetails(w))}`,
    `LOCATION:${esc(`${w.ceremony.name}, ${w.ceremony.address}`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Wedding tomorrow", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "wedding.ics" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
