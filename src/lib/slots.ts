// Pure scheduling helpers. Slot keys are UTC epoch minutes.

export const EXPIRY_DAYS = 21;

export type EventShape = {
  start_date: string;
  end_date: string;
  start_minute: number;
  end_minute: number;
  slot_minutes: number;
  timezone: string;
  dates?: string[] | null | undefined;
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
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
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
  const [y = 0, m = 1, d = 1] = start.split("-").map(Number);
  const cur = new Date(Date.UTC(y, m - 1, d));
  const endMs = Date.parse(end + "T00:00:00Z");
  while (cur.getTime() <= endMs && out.length < max) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** grid[dayIndex][rowIndex] = epoch minute */
export function availabilityMinutes(ev: EventShape): number {
  return ev.slot_minutes % 30 === 0 && ev.start_minute % 30 === 0 && ev.end_minute % 30 === 0 ? 30 : 15;
}

export function buildGrid(ev: EventShape, interval = ev.slot_minutes): { dates: string[]; rows: number; grid: number[][] } {
  const dates = ev.dates && ev.dates.length ? [...ev.dates].sort() : listDates(ev.start_date, ev.end_date);
  const rows = Math.max(0, Math.floor((ev.end_minute - ev.start_minute) / interval));
  const grid = dates.map((d) =>
    Array.from({ length: rows }, (_, r) =>
      zonedToEpochMinutes(d, ev.start_minute + r * interval, ev.timezone),
    ),
  );
  return { dates, rows, grid };
}

/** Legacy keys represent entire meeting-length blocks; expand without changing stored data. */
export function normalizeAvailability(ev: EventShape, response: { slots: number[]; availability_minutes?: number | null }) {
  const interval = availabilityMinutes(ev);
  const valid = new Set(buildGrid(ev, interval).grid.flat());
  const duration = response.availability_minutes ?? ev.slot_minutes;
  const expanded = new Set<number>();
  for (const start of response.slots.map(Number)) {
    for (let offset = 0; offset < duration; offset += interval) {
      if (valid.has(start + offset)) expanded.add(start + offset);
    }
  }
  return [...expanded].sort((a, b) => a - b);
}

export function availableForRange(slots: number[], start: number, end: number, interval: number): boolean {
  if (end <= start || (end - start) % interval !== 0) return false;
  const set = new Set(slots.map(Number));
  for (let slot = start; slot < end; slot += interval) if (!set.has(slot)) return false;
  return true;
}

export function isExpired(expiresAt: string, now = Date.now()): boolean {
  return Date.parse(expiresAt) <= now;
}

export function expiryFrom(createdMs: number): Date {
  return new Date(createdMs + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export type Recommendation = { start: number; end: number; count: number; names: string[] };
export type RankedTime = Recommendation & {
  rank: number;
  /** Adjacent slots (0–2) where the same people are all still free. */
  buffer: number;
  /** How many other slots share this attendance count. */
  tiedWith: number;
  reason: string;
};

/**
 * Rank every slot with at least one attendee, best to worst. Distinct ranks:
 * most attendees, then most buffer (neighbouring slots where the same people
 * are still free), then earliest.
 */
export function rankTimes(
  grid: number[][],
  slotMinutes: number,
  responses: { name: string; slots: number[] }[],
  interval = slotMinutes,
): RankedTime[] {
  const sets = responses.map((r) => ({ name: r.name, set: new Set(r.slots.map(Number)) }));
  const base: (Recommendation & { buffer: number })[] = [];
  for (const col of grid) {
    col.forEach((slot, i) => {
      const end = slot + slotMinutes;
      if (!col.includes(end - interval)) return;
      const who = sets.filter((s) => availableForRange([...s.set], slot, end, interval));
      if (!who.length) return;
      const allFree = (n: number | undefined) => n != null && who.every((s) => s.set.has(n));
      const buffer = (allFree(col[i - 1]) ? 1 : 0) + (allFree(col[i + slotMinutes / interval]) ? 1 : 0);
      base.push({ start: slot, end: slot + slotMinutes, count: who.length, names: who.map((s) => s.name), buffer });
    });
  }
  base.sort((a, b) => b.count - a.count || b.buffer - a.buffer || a.start - b.start);
  const byCount = new Map<number, number>();
  for (const b of base) byCount.set(b.count, (byCount.get(b.count) ?? 0) + 1);
  return base.map((b, i) => {
    const tiedWith = (byCount.get(b.count) ?? 1) - 1;
    let reason = "";
    if (tiedWith > 0) {
      const prev = base[i - 1];
      const sameAsPrev = prev && prev.count === b.count;
      if (!sameAsPrev) reason = b.buffer > 0 ? `Tied on attendance with ${tiedWith} other time${tiedWith === 1 ? "" : "s"} · ranked higher for open time around it` : `Tied on attendance with ${tiedWith} other time${tiedWith === 1 ? "" : "s"} · earliest option`;
      else reason = prev.buffer > b.buffer ? "Same attendance · less open time around it" : "Same attendance · later option";
    }
    return { ...b, rank: i + 1, tiedWith, reason };
  });
}

/** Rank individual slots (poll's own slot length) by attendance, earliest first on ties; return top N. */
export function topTimes(
  grid: number[][],
  slotMinutes: number,
  responses: { name: string; slots: number[] }[],
  n = 3,
  interval = slotMinutes,
): Recommendation[] {
  const sets = responses.map((r) => ({ name: r.name, set: new Set(r.slots.map(Number)) }));
  const out: Recommendation[] = [];
  for (const col of grid) {
    for (const slot of col) {
      if (!col.includes(slot + slotMinutes - interval)) continue;
      const names = sets.filter((s) => availableForRange([...s.set], slot, slot + slotMinutes, interval)).map((s) => s.name);
      if (names.length) out.push({ start: slot, end: slot + slotMinutes, count: names.length, names });
    }
  }
  return out.sort((a, b) => b.count - a.count || a.start - b.start).slice(0, n);
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
