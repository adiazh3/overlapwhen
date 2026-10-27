import { describe, expect, it } from "vitest";
import { creationWindowError } from "@/lib/creation-window";

describe("usable poll creation windows", () => {
  it("rejects a 15-minute window for a 60-minute meeting", () => {
    expect(creationWindowError(540, 555, 60)).not.toBeNull();
  });
  it("accepts exactly one complete 45-minute meeting", () => {
    expect(creationWindowError(540, 585, 45)).toBeNull();
  });
  it("rejects reversed time boundaries", () => {
    expect(creationWindowError(600, 540, 30)).not.toBeNull();
  });
});