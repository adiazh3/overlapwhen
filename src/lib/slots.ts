// Pure scheduling helpers. Slot keys are UTC epoch minutes.

export const EXPIRY_DAYS = 21;

export type EventShape = {
  start_date: string;
  end_date: string;
  start_minute: number;
  end_minute: number;
  slot_minutes: number;
  timezone: string;
};

export function tzOffsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** Wall-clock date + minute-of-day in tz -> UTC epoch minutes */
export function zonedToEpochMinutes(date: string, minuteOfDay: number, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minuteOfDay);
  let off = tzOffsetMinutes(guess, tz);
  let utc = guess - off * 60000;
  const off2 = tzOffsetMinutes(utc, tz);
  if (off2 !== off) {
    off = off2;
    utc = guess - off * 60000;
  }
  return Math.round(utc / 60000);
}

export function listDates(start: string, end: string, max = 31): string[] {
  const out: string[] = [];
  const [y, m, d] = start.split("-").map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d));
  const endMs = Date.parse(end + "T00:00:00Z");
  while (cur.getTime() <= endMs && out.length < max) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** grid[dayIndex][rowIndex] = epoch minute */
export function buildGrid(ev: EventShape): { dates: string[]; rows: number; grid: number[][] } {
  const dates = listDates(ev.start_date, ev.end_date);
  const rows = Math.max(0, Math.floor((ev.end_minute - ev.start_minute) / ev.slot_minutes));
  const grid = dates.map((d) =>
    Array.from({ length: rows }, (_, r) =>
      zonedToEpochMinutes(d, ev.start_minute + r * ev.slot_minutes, ev.timezone),
    ),
  );
  return { dates, rows, grid };
}

export function isExpired(expiresAt: string, now = Date.now()): boolean {
  return Date.parse(expiresAt) <= now;
}

export function expiryFrom(createdMs: number): Date {
  return new Date(createdMs + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export type Recommendation = { start: number; end: number; count: number; names: string[] };

/** Merge consecutive slots (same day column) with identical attendee sets; return top N. */
export function topTimes(
  grid: number[][],
  slotMinutes: number,
  responses: { name: string; slots: number[] }[],
  n = 3,
): Recommendation[] {
  const sets = responses.map((r) => ({ name: r.name, set: new Set(r.slots.map(Number)) }));
  const ranges: Recommendation[] = [];
  for (const col of grid) {
    let cur: Recommendation | null = null;
    for (const slot of col) {
      const names = sets.filter((s) => s.set.has(slot)).map((s) => s.name);
      const key = names.join("|");
      if (cur && names.length > 0 && cur.names.join("|") === key && cur.end === slot) {
        cur.end = slot + slotMinutes;
      } else {
        if (cur) ranges.push(cur);
        cur = names.length > 0 ? { start: slot, end: slot + slotMinutes, count: names.length, names } : null;
      }
    }
    if (cur) ranges.push(cur);
  }
  return ranges
    .sort((a, b) => b.count - a.count || b.end - b.start - (a.end - a.start) || a.start - b.start)
    .slice(0, n);
}

function icsDate(epochMin: number) {
  return new Date(epochMin * 60000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(title: string, details: string, start: number, end: number) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${icsDate(start)}/${icsDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function buildIcs(uid: string, title: string, details: string, start: number, end: number) {
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Overlap//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@overlap`,
    `DTSTAMP:${icsDate(Math.floor(Date.now() / 60000))}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function fmtTime(epochMin: number, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(
    new Date(epochMin * 60000),
  );
}

export function fmtDay(epochMin: number, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(
    new Date(epochMin * 60000),
  );
}

export function fmtRange(start: number, end: number, tz: string) {
  return `${fmtDay(start, tz)} · ${fmtTime(start, tz)} – ${fmtTime(end, tz)}`;
}
