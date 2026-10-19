import { useEffect, useState } from "react";
import { getHistory, HISTORY_EVENT, type HistoryEntry } from "@/lib/poll-history";

export function useHistory(): HistoryEntry[] {
  const [list, setList] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const load = () => setList(getHistory());
    load();
    window.addEventListener(HISTORY_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(HISTORY_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return list;
}
