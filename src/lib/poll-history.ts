export type HistoryEntry = {
  id: string;
  title: string;
  role: "creator" | "participant";
  name?: string | undefined;
  createdAt: number;
  lastVisitedAt: number;
  expiresAt?: string | undefined;
};

const KEY = "overlap:history:v1";
export const HISTORY_EVENT = "overlap-history-change";

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function setHistory(list: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function mergeEntry(list: HistoryEntry[], e: Partial<HistoryEntry> & { id: string }, now: number): HistoryEntry[] {
  const prev = list.find((x) => x.id === e.id);
  const next: HistoryEntry = {
    id: e.id,
    title: e.title ?? prev?.title ?? "Untitled poll",
    role: prev?.role === "creator" || e.role === "creator" ? "creator" : "participant",
    name: e.name ?? prev?.name,
    createdAt: prev?.createdAt ?? now,
    lastVisitedAt: now,
    expiresAt: e.expiresAt ?? prev?.expiresAt,
  };
  return [next, ...list.filter((x) => x.id !== e.id)];
}

export function recordPoll(e: Partial<HistoryEntry> & { id: string }) {
  setHistory(mergeEntry(getHistory(), e, Date.now()));
}

export function removePoll(id: string) {
  setHistory(getHistory().filter((x) => x.id !== id));
  localStorage.removeItem(`overlap:admin:${id}`);
}

/** Backup code: includes organizer keys so polls can be managed on another device. */
export function exportCode(): string {
  const items = getHistory().map((h) => ({ ...h, admin: localStorage.getItem(`overlap:admin:${h.id}`) ?? undefined }));
  return btoa(unescape(encodeURIComponent(JSON.stringify(items))));
}

export function importCode(code: string): number {
  const items = JSON.parse(decodeURIComponent(escape(atob(code.trim())))) as (HistoryEntry & { admin?: string })[];
  if (!Array.isArray(items)) throw new Error("bad code");
  let list = getHistory();
  for (const it of items) {
    if (typeof it?.id !== "string") continue;
    if (it.admin) localStorage.setItem(`overlap:admin:${it.id}`, it.admin);
    const existing = list.find((x) => x.id === it.id);
    list = mergeEntry(list, { ...it }, existing?.lastVisitedAt ?? it.lastVisitedAt ?? Date.now());
  }
  setHistory(list.sort((a, b) => b.lastVisitedAt - a.lastVisitedAt));
  return items.length;
}
