import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getEventData } from "@/lib/events.functions";
import { syncHistoryPoll } from "@/lib/poll-history";

export const POLL_CHANGED_KEY = "overlap:poll-changed";

export const eventQuery = (id: string) => queryOptions({
  queryKey: ["event", id],
  queryFn: async () => {
    const data = await getEventData({ data: { id } });
    if (typeof window !== "undefined" && data.event) syncHistoryPoll(data.event, data.responses.length);
    return data;
  },
  staleTime: 3000,
  refetchOnWindowFocus: "always",
  refetchOnReconnect: "always",
  retry: (count, error) => count < 3 && (error instanceof TypeError || (error instanceof Error && /load failed|networkerror|failed to fetch|aborted/i.test(error.message))),
  retryDelay: (n) => 400 * (n + 1),
});

/** Notify other tabs only after a successful write; never send identities or PINs. */
export async function refreshChangedPoll(client: QueryClient, id: string) {
  try { localStorage.setItem(POLL_CHANGED_KEY, JSON.stringify({ id, at: Date.now() })); } catch { /* storage may be unavailable */ }
  await client.invalidateQueries({ queryKey: ["event", id], exact: true });
}