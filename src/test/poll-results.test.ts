import { describe, expect, it } from "vitest";
import { slotResults, votePercentage } from "@/lib/poll-results";

describe("availability vote results", () => {
  it("shows vote counts and participant percentages for each time after voting", () => {
    expect(slotResults([[0, 30, 60]], [
      { slots: [0, 30] }, { slots: [30] }, { slots: [] },
    ])).toEqual([
      { start: 30, count: 2, percentage: 67 },
      { start: 0, count: 1, percentage: 33 },
      { start: 60, count: 0, percentage: 0 },
    ]);
  });

  it("counts one vote per participant per time even if a slot is duplicated", () => {
    expect(slotResults([[30]], [{ slots: [30, 30] }])).toEqual([
      { start: 30, count: 1, percentage: 100 },
    ]);
  });

  it("returns zero percent before any responses exist", () => {
    expect(votePercentage(0, 0)).toBe(0);
    expect(slotResults([[30]], [])).toEqual([{ start: 30, count: 0, percentage: 0 }]);
  });
});