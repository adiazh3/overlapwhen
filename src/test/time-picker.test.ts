import { describe, expect, it } from "vitest";
import { timeOptions } from "@/lib/time-picker";

describe("time picker increments", () => {
  it("offers each 15-minute time throughout the day", () => {
    const options = timeOptions(15);
    expect(options).toHaveLength(96);
    expect(options.slice(36, 40)).toEqual([540, 555, 570, 585]);
    expect(options.at(-1)).toBe(1425);
  });

  it("offers each one-hour time throughout the day", () => {
    const options = timeOptions(60);
    expect(options).toHaveLength(24);
    expect(options.slice(9, 12)).toEqual([540, 600, 660]);
    expect(options.at(-1)).toBe(1380);
  });

  it("allows the end time to reach midnight", () => {
    expect(timeOptions(15, true).at(-1)).toBe(1440);
    expect(timeOptions(60, true).at(-1)).toBe(1440);
  });
});