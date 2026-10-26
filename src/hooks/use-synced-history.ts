import { useQueries } from "@tanstack/react-query";
import { useHistory } from "@/hooks/use-history";
import { eventQuery } from "@/lib/poll-query";

/** Device-local IDs are known only after hydration; share the poll page's cache. */
export function useSyncedHistory(limit?: number) {
  const list = useHistory();
  const entries = limit == null ? list : list.slice(0, limit);
  const queries = useQueries({ queries: entries.map((entry) => ({
    ...eventQuery(entry.id),
    enabled: !entry.expiresAt || Date.parse(entry.expiresAt) > Date.now(),
    refetchOnMount: "always" as const,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  })) });
  return {
    list,
    refreshing: queries.some((query) => query.isFetching),
    failedIds: new Set(entries.filter((_, index) => queries[index]?.isError).map((entry) => entry.id)),
    refresh: () => Promise.all(queries.map((query, index) => {
      const entry = entries[index];
      if (entry?.expiresAt && Date.parse(entry.expiresAt) <= Date.now()) return Promise.resolve();
      return query.refetch();
    })),
  };
}