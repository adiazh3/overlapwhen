import { describe, expect, it } from "vitest";
import { applyPollSnapshot, mergeEntry } from "@/lib/poll-history";

describe("mergeEntry", () => {
  it("keeps organizer role once a poll was created here", () => {
    const a = mergeEntry([], { id: "x", title: "T", role: "creator" }, 1);
    const b = mergeEntry(a, { id: "x", role: "participant", name: "Al" }, 2);
    expect(b).toHaveLength(1);
    expect(b[0]?.role).toBe("creator");
    expect(b[0]?.name).toBe("Al");
    expect(b[0]?.createdAt).toBe(1);
  });
});

describe("fresh poll snapshots", () => {
  const list = mergeEntry([], { id: "x", title: "Before", role: "creator", name: "Alex", status: "locked", lockedStart: "2026-10-27T09:00:00Z" }, 100);
  const poll = { id: "x", title: "Updated", expires_at: "2026-11-10T00:00:00Z", closed: false, final_start: null };
  const now = Date.parse("2026-10-26T00:00:00Z");
  it("reopening clears the old locked time and returns to active", () => {
    const updated = applyPollSnapshot(list, poll, 3, now)[0];
    expect(updated?.status).toBe("active");
    expect(updated?.lockedStart).toBeUndefined();
  });
  it("updates saved vote counts without changing identity or visit order", () => {
    const updated = applyPollSnapshot(list, poll, 4, now)[0];
    expect(updated?.responseCount).toBe(4);
    expect(updated?.lastVisitedAt).toBe(100);
    expect(updated?.createdAt).toBe(100);
    expect(updated?.role).toBe("creator");
    expect(updated?.name).toBe("Alex");
  });
  it("distinguishes locked meetings from early closure", () => {
    expect(applyPollSnapshot(list, { ...poll, closed: true, final_start: "2026-10-27T09:00:00Z" }, 2, now)[0]?.status).toBe("locked");
    expect(applyPollSnapshot(list, { ...poll, closed: true }, 2, now)[0]?.status).toBe("closed");
  });
  it("does not resurrect removed polls and expires old links", () => {
    expect(applyPollSnapshot([], poll, 2, now)).toEqual([]);
    expect(applyPollSnapshot(list, { ...poll, expires_at: "2026-10-25T00:00:00Z" }, 0, now)[0]?.status).toBe("expired");
  });
});
