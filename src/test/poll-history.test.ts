import { describe, expect, it } from "vitest";
import { mergeEntry } from "@/lib/poll-history";

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
