import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { POLL_CHANGED_KEY } from "@/lib/poll-query";

export function usePollSync() {
  const client = useQueryClient();
  useEffect(() => {
    const refresh = (id: unknown) => {
      if (typeof id === "string" && /^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
        void client.invalidateQueries({ queryKey: ["event", id], exact: true });
      }
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== POLL_CHANGED_KEY || !event.newValue) return;
      try { refresh(JSON.parse(event.newValue).id); } catch { /* ignore invalid cross-tab data */ }
    };
    const resume = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void client.invalidateQueries({ queryKey: ["event"], refetchType: "active" });
      }
    };
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [client]);
}