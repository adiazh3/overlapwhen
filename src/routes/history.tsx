import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Archive, CalendarClock, Clock, Copy, ExternalLink, Info, KeyRound, Lock, Search, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHistory } from "@/hooks/use-history";
import { exportCode, importCode, removePoll, type HistoryEntry, type PollStatus } from "@/lib/poll-history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "My polls · Overlap" },
      { name: "description", content: "Find every Overlap poll you created or answered on this device." },
      { property: "og:title", content: "My polls · Overlap" },
      { property: "og:description", content: "Search and revisit your Overlap poll links — no account needed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

type Filter = "all" | "creator" | "participant";
type StatusFilter = "all" | "active" | "locked" | "closed";
type Sort = "recent" | "newest" | "expiring";

function statusOf(h: HistoryEntry): PollStatus {
  if (h.expiresAt && Date.parse(h.expiresAt) <= Date.now()) return "expired";
  return h.status ?? "active";
}

const STATUS_META: Record<PollStatus, { label: string; className: string; Icon?: LucideIcon }> = {
  active: { label: "Active", className: "border-highlight/50 bg-highlight/10 text-highlight" },
  locked: { label: "Locked in", className: "border-primary bg-primary text-primary-foreground", Icon: Lock },
  closed: { label: "Closed", className: "border-border bg-muted text-muted-foreground", Icon: Archive },
  expired: { label: "Expired", className: "border-border text-muted-foreground", Icon: Clock },
};

function StatusBadge({ status }: { status: PollStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${meta.className}`}>
      {status === "active" && <span className="size-1.5 animate-pulse rounded-full bg-highlight" aria-hidden />}
      {meta.Icon && <meta.Icon className="size-3" aria-hidden />}
      {meta.label}
    </span>
  );
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "locked", label: "Locked in" },
  { key: "closed", label: "Closed" },
];

function matchesStatus(h: HistoryEntry, f: StatusFilter): boolean {
  if (f === "all") return true;
  const s = statusOf(h);
  if (f === "closed") return s === "closed" || s === "expired";
  return s === f;
}

function EmptyState({ Icon, title, body, cta }: { Icon: LucideIcon; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="font-display text-lg font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {cta}
    </li>
  );
}

function HistoryPage() {
  const list = useHistory();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [code, setCode] = useState("");

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: list.length, active: 0, locked: 0, closed: 0 };
    for (const h of list) {
      const s = statusOf(h);
      if (s === "active") c.active++;
      else if (s === "locked") c.locked++;
      else c.closed++;
    }
    return c;
  }, [list]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = list.filter(
      (h) =>
        (filter === "all" || h.role === filter) &&
        matchesStatus(h, statusFilter) &&
        (!s || h.title.toLowerCase().includes(s) || (h.name ?? "").toLowerCase().includes(s)),
    );
    const exp = (h: (typeof out)[number]) => (h.expiresAt ? Date.parse(h.expiresAt) : Infinity);
    const bySort = (a: (typeof out)[number], b: (typeof out)[number]) =>
      sort === "recent" ? b.lastVisitedAt - a.lastVisitedAt : sort === "newest" ? b.createdAt - a.createdAt : exp(a) - exp(b);
    // Active polls always float above concluded ones.
    return [...out.filter((h) => statusOf(h) === "active").sort(bySort), ...out.filter((h) => statusOf(h) !== "active").sort(bySort)];
  }, [list, q, filter, statusFilter, sort]);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch { toast.error("Couldn't copy. Please try again."); }
  };

  const searching = q.trim().length > 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <p className="eyebrow">Saved on this device</p>
      <h1 className="display-xl mt-4">My polls</h1>
      <p className="mt-2 text-muted-foreground">Every poll you've created or answered on this device appears here automatically.</p>
      <p className="mt-2 text-xs text-muted-foreground">Statuses reflect your last visit. Open a poll to check the latest responses or confirmed time.</p>

      <div className="mt-4 flex gap-3 border-y py-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>
          This list is saved in <strong>this browser only</strong>. Clearing browsing data or switching phones/computers won't show it.
          To move it, use a <strong>backup code</strong> below.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search polls" placeholder="Search by poll or your name" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
        >
          <option value="recent">Recently opened</option>
          <option value="newest">Newest first</option>
          <option value="expiring">Expiring soon</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            size="sm"
            decoration="none"
            aria-pressed={statusFilter === f.key}
            variant={statusFilter === f.key ? "default" : "outline"}
            onClick={() => setStatusFilter(f.key)}
            className="rounded-full"
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] tracking-normal",
                statusFilter === f.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {counts[f.key]}
            </span>
          </Button>
        ))}
        <span className="mx-1 hidden w-px self-stretch bg-border sm:block" aria-hidden />
        {(["creator", "participant"] as Filter[]).map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            decoration="none"
            aria-pressed={filter === f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter((prev) => (prev === f ? "all" : f))}
            className="rounded-full"
          >
            {f === "creator" ? "Created by me" : "Answered"}
          </Button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {shown.length === 0 && (
          list.length === 0 ? (
            <EmptyState
              Icon={CalendarClock}
              title="No polls yet"
              body="Create a poll or open a link someone shared — it'll show up here automatically."
              cta={
                <Button asChild className="mt-1">
                  <Link to="/" hash="create-poll">Create a poll</Link>
                </Button>
              }
            />
          ) : searching ? (
            <EmptyState Icon={Search} title="No matches" body={`Nothing matches "${q.trim()}". Try a different poll title or name.`} />
          ) : statusFilter === "active" ? (
            <EmptyState
              Icon={CalendarClock}
              title="No active polls"
              body="Everything here is wrapped up. Start a new poll to find your next time."
              cta={
                <Button asChild className="mt-1">
                  <Link to="/" hash="create-poll">Create a poll</Link>
                </Button>
              }
            />
          ) : statusFilter === "locked" ? (
            <EmptyState Icon={Lock} title="No locked-in polls" body="When a time gets locked in on one of your polls, it'll show up here with the final time." />
          ) : (
            <EmptyState Icon={Archive} title="No closed polls" body="Polls that are closed early or expire will land here, so you can always look back." />
          )
        )}
        {shown.map((h) => {
          const status = statusOf(h);
          const concluded = status !== "active";
          const days = h.expiresAt ? Math.ceil((Date.parse(h.expiresAt) - Date.now()) / 86400000) : null;
          const url = `${window.location.origin}/e/${h.id}`;
          return (
            <li
              key={h.id}
              className={cn(
                "rounded-lg border bg-card p-4 shadow-soft transition",
                status === "active" && "border-l-2 border-l-highlight",
                status === "locked" && "border-primary/40",
                concluded && status !== "locked" && "bg-muted/50",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link to="/e/$id" params={{ id: h.id }} className="font-display text-lg font-medium hover:text-highlight">
                      {h.title}
                    </Link>
                    <StatusBadge status={status} />
                  </div>
                  {status === "locked" && h.lockedStart && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                      <Lock className="size-3.5 text-highlight" aria-hidden />
                      {new Date(h.lockedStart).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  )}
                  <div className="eyebrow mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-foreground">{h.role === "creator" ? "Organizer" : "Participant"}</span>
                    {h.name && <span>Answered as {h.name}</span>}
                    {days != null && status !== "expired" && <span>{days > 0 ? `Expires in ${days} day${days === 1 ? "" : "s"}` : "Expired"}</span>}
                    <span>Opened {new Date(h.lastVisitedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(url, "Link copied")}>
                    <Copy /> Copy link
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/e/$id" params={{ id: h.id }}>
                      <ExternalLink /> Open
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${h.title} from list`}
                    onClick={() => {
                      if (confirm("Remove this poll from your list? The poll itself isn't deleted.")) removePoll(h.id);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-12 rounded-lg bg-band p-6 text-band-foreground [&_p]:text-band-muted">
        <h2 className="flex items-center gap-2 font-medium">
          <KeyRound className="size-4" /> Use on another device
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy your backup code and paste it on your other device. It includes organizer access, so keep it private.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button variant="secondary" className="self-start" disabled={list.length === 0} onClick={() => copy(exportCode(), "Backup code copied")}>
            Copy backup code
          </Button>
          <Input aria-label="Backup code to restore" className="bg-card text-foreground" placeholder="Paste a backup code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button
            variant="secondary"
            className="self-start"
            disabled={!code.trim()}
            onClick={() => {
              try {
                const n = importCode(code);
                setCode("");
                toast.success(`Added ${n} poll${n === 1 ? "" : "s"}`);
              } catch {
                toast.error("That code doesn't look right");
              }
            }}
          >
            Restore
          </Button>
        </div>
      </section>
    </main>
  );
}
