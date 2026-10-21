import { describe, expect, it } from "vitest";
import { buildGrid, expiryFrom, isExpired, rankTimes, topTimes, zonedToEpochMinutes } from "@/lib/slots";

describe("scheduling rules", () => {
  it("poll links expire 21 days after creation", () => {
    const created = Date.UTC(2026, 0, 1);
    expect(expiryFrom(created).toISOString()).toBe("2026-01-22T00:00:00.000Z");
    expect(isExpired("2026-01-22T00:00:00.000Z", Date.UTC(2026, 0, 21))).toBe(false);
    expect(isExpired("2026-01-22T00:00:00.000Z", Date.UTC(2026, 0, 22))).toBe(true);
  });

  it("builds 15-minute slots over the daily window", () => {
    const g = buildGrid({ start_date: "2026-03-02", end_date: "2026-03-03", start_minute: 540, end_minute: 1260, slot_minutes: 15, timezone: "UTC" });
    expect(g.dates).toEqual(["2026-03-02", "2026-03-03"]);
    expect(g.rows).toBe(48);
  });

  it("converts wall-clock time in a timezone to UTC", () => {
    expect(zonedToEpochMinutes("2026-07-01", 540, "America/New_York")).toBe(Date.UTC(2026, 6, 1, 13) / 60000);
  });

  it("ranks the slot with the most overlap first", () => {
    const grid = [[0, 30, 60]];
    const recs = topTimes(grid, 30, [
      { name: "A", slots: [0, 30] },
      { name: "B", slots: [30] },
    ]);
    expect(recs[0]).toMatchObject({ start: 30, end: 60, count: 2 });
  });

  it("recommends single slots matching the poll's slot length, not merged blocks", () => {
    const grid = [[0, 60, 120, 180]];
    const all = [0, 60, 120, 180];
    const recs = topTimes(grid, 60, [{ name: "A", slots: all }, { name: "B", slots: all }]);
    expect(recs.map((r) => [r.start, r.end])).toEqual([[0, 60], [60, 120], [120, 180]]);
  });

  it("breaks attendance ties with distinct ranks, preferring slots with open time around them", () => {
    const grid = [[0, 60, 120, 180]];
    const all = [0, 60, 120, 180];
    const ranked = rankTimes(grid, 60, [{ name: "A", slots: all }, { name: "B", slots: all }]);
    expect(ranked.map((r) => [r.rank, r.start])).toEqual([[1, 60], [2, 120], [3, 0], [4, 180]]);
    expect(ranked[0].tiedWith).toBe(3);
  });

  it("ranks more attendees above more buffer", () => {
    const grid = [[0, 60, 120]];
    const ranked = rankTimes(grid, 60, [{ name: "A", slots: [0, 60, 120] }, { name: "B", slots: [120] }]);
    expect(ranked[0]).toMatchObject({ start: 120, count: 2, rank: 1 });
  });
});
