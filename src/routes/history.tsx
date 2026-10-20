import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Info, KeyRound, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHistory } from "@/hooks/use-history";
import { exportCode, importCode, removePoll } from "@/lib/poll-history";

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
type Sort = "recent" | "newest" | "expiring";

function HistoryPage() {
  const list = useHistory();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [code, setCode] = useState("");

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = list.filter(
      (h) =>
        (filter === "all" || h.role === filter) &&
        (!s || h.title.toLowerCase().includes(s) || (h.name ?? "").toLowerCase().includes(s)),
    );
    const exp = (h: (typeof out)[number]) => (h.expiresAt ? Date.parse(h.expiresAt) : Infinity);
    return out.sort((a, b) =>
      sort === "recent" ? b.lastVisitedAt - a.lastVisitedAt : sort === "newest" ? b.createdAt - a.createdAt : exp(a) - exp(b),
    );
  }, [list, q, filter, sort]);

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <p className="eyebrow">Saved on this device</p>
      <h1 className="display-xl mt-4">My polls</h1>
      <p className="mt-2 text-muted-foreground">Every poll you've created or answered on this device appears here automatically.</p>

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
        {(["all", "creator", "participant"] as Filter[]).map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            decoration="none"
            aria-pressed={filter === f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="rounded-full"
          >
            {f === "all" ? "All" : f === "creator" ? "Created by me" : "Answered"}
          </Button>
        ))}
      </div>

      <ul className="mt-6 border-t">
        {shown.length === 0 && (
          <li className="border-b py-10 text-center text-sm text-muted-foreground">
            {list.length === 0 ? (
              <>
                No polls yet. <Link to="/" className="underline">Create one</Link> or open a link someone shared — it'll show up here.
              </>
            ) : (
              "No polls match your search."
            )}
          </li>
        )}
        {shown.map((h) => {
          const days = h.expiresAt ? Math.ceil((Date.parse(h.expiresAt) - Date.now()) / 86400000) : null;
          const url = `${window.location.origin}/e/${h.id}`;
          return (
            <li key={h.id} className="border-b py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to="/e/$id" params={{ id: h.id }} className="font-display text-lg font-medium hover:text-highlight">
                    {h.title}
                  </Link>
                  <div className="eyebrow mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-foreground">{h.role === "creator" ? "Organizer" : "Participant"}</span>
                    {h.name && <span>Answered as {h.name}</span>}
                    {days != null && <span>{days > 0 ? `Expires in ${days} day${days === 1 ? "" : "s"}` : "Expired"}</span>}
                    <span>Opened {new Date(h.lastVisitedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
