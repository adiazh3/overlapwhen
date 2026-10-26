export type PollStatus = "active" | "locked" | "closed" | "expired";

export type HistoryEntry = {
  id: string;
  title: string;
  role: "creator" | "participant";
  name?: string | undefined;
  createdAt: number;
  lastVisitedAt: number;
  expiresAt?: string | undefined;
  status?: PollStatus | undefined;
  lockedStart?: string | undefined;
  responseCount?: number | undefined;
  syncedAt?: number | undefined;
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
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { return; }
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
    status: e.status ?? prev?.status,
    lockedStart: e.lockedStart ?? prev?.lockedStart,
    responseCount: e.responseCount ?? prev?.responseCount,
    syncedAt: e.syncedAt ?? prev?.syncedAt,
  };
  return [next, ...list.filter((x) => x.id !== e.id)];
}

export function recordPoll(e: Partial<HistoryEntry> & { id: string }) {
  setHistory(mergeEntry(getHistory(), e, Date.now()));
}

export function applyPollSnapshot(list: HistoryEntry[], poll: { id: string; title: string; expires_at: string; closed: boolean; final_start: string | null }, responseCount: number, now: number): HistoryEntry[] {
  return list.map((entry) => entry.id !== poll.id ? entry : {
    ...entry,
    title: poll.title,
    expiresAt: poll.expires_at,
    status: Date.parse(poll.expires_at) <= now ? "expired" : poll.final_start ? "locked" : poll.closed ? "closed" : "active",
    lockedStart: poll.final_start ?? undefined,
    responseCount,
    syncedAt: now,
  });
}

/** Refresh metadata without moving cards or resurrecting removed history entries. */
export function syncHistoryPoll(poll: Parameters<typeof applyPollSnapshot>[1], responseCount: number) {
  const list = getHistory();
  if (!list.some((entry) => entry.id === poll.id)) return;
  setHistory(applyPollSnapshot(list, poll, responseCount, Date.now()));
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
