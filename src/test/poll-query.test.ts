import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/events.functions", () => ({ getEventData: read }));
import { eventQuery, refreshChangedPoll } from "@/lib/poll-query";
import { getHistory, recordPoll } from "@/lib/poll-history";

beforeEach(() => { localStorage.clear(); read.mockReset(); });
describe("shared scoped poll cache", () => {
  it("deduplicates reads and updates cards from the same snapshot", async () => {
    recordPoll({ id: "abc", title: "Original", role: "creator" });
    read.mockResolvedValue({ event: { id: "abc", title: "Fresh", expires_at: "2099-01-01", closed: true, final_start: null }, responses: [{ id: "r" }] });
    const client = new QueryClient();
    await Promise.all([client.fetchQuery(eventQuery("abc")), client.fetchQuery(eventQuery("abc"))]);
    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith({ data: { id: "abc" } });
    expect(getHistory()[0]?.status).toBe("closed");
    expect(getHistory()[0]?.responseCount).toBe(1);
    client.clear();
  });
  it("invalidates only the changed poll after successful writes", async () => {
    const client = new QueryClient();
    client.setQueryData(["event", "abc"], { value: 1 });
    client.setQueryData(["event", "other"], { value: 2 });
    await refreshChangedPoll(client, "abc");
    expect(client.getQueryState(["event", "abc"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["event", "other"])?.isInvalidated).toBe(false);
    client.clear();
  });
});