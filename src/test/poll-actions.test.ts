import { describe, expect, it } from "vitest";
import { validatePollAction } from "@/lib/poll-actions";
import { buildGrid } from "@/lib/slots";

const event = {
  start_date: "2026-10-21", end_date: "2026-10-21",
  start_minute: 540, end_minute: 660, slot_minutes: 30,
  timezone: "UTC", admin_token: "organizer-private-token",
};
const start = buildGrid(event).grid[0]?.[0] ?? 0;

describe("collaborative scheduling permissions", () => {
  it("allows anyone with the link to lock a proposed time without a token", () => {
    expect(() => validatePollAction(event, { action: "lock", start, end: start + 60 })).not.toThrow();
  });
  it("allows anyone with the link to reopen without a token", () => {
    expect(() => validatePollAction(event, { action: "reopen" })).not.toThrow();
  });
  it("keeps early closure organizer-only", () => {
    expect(() => validatePollAction(event, { action: "close" })).toThrow("Only the organizer");
    expect(() => validatePollAction(event, { action: "close", token: "wrong-token" })).toThrow("Only the organizer");
    expect(() => validatePollAction(event, { action: "close", token: event.admin_token })).not.toThrow();
  });
  it("rejects locking times outside the poll or off slot boundaries", () => {
    for (const [from, to] of [[start - 30, start], [start, start + 150], [start, start + 15]]) {
      expect(() => validatePollAction(event, { action: "lock", start: from, end: to })).toThrow();
    }
  });
});