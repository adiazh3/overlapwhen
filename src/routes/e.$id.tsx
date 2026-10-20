import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  Copy,
  Download,
  Globe,
  Hourglass,
  Lock,
  Loader2,
  MessageSquareText,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { PollResults } from "@/components/PollResults";
import { votePercentage } from "@/lib/poll-results";
import { adminUpdate, checkName, getEventData, saveResponse, type ResponseRow } from "@/lib/events.functions";
import { buildGrid, buildIcs, fmtRange, googleCalendarUrl, isExpired, topTimes } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { recordPoll } from "@/lib/poll-history";

const eventQuery = (id: string) =>
  queryOptions({ queryKey: ["event", id], queryFn: () => getEventData({ data: { id } }) });

export const Route = createFileRoute("/e/$id")({
  validateSearch: z.object({ admin: z.string().optional() }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(eventQuery(params.id)),
  head: ({ loaderData }) => {
    const t = loaderData?.event?.title;
    const title = t ? `${t} — pick your times · Overlap` : "Poll unavailable · Overlap";
    const desc = t ? `Mark when you're free for “${t}”. Takes 20 seconds, no sign-up.` : "This poll couldn't be found.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: EventPage,
});

type Me = { name: string; pin: string };

function EventPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(eventQuery(id));
  const ev = data.event;
  const responses = data.responses;

  const save = useServerFn(saveResponse);
  const check = useServerFn(checkName);
  const admin = useServerFn(adminUpdate);

  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [tzPick, setTzPick] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [mine, setMine] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setViewerTz(local);
    setTzPick(localStorage.getItem(`overlap:tz:${id}`) ?? local);
    const key = `overlap:admin:${id}`;
    if (search.admin) localStorage.setItem(key, search.admin);
    setAdminToken(search.admin ?? localStorage.getItem(key));
    const raw = localStorage.getItem(`overlap:me:${id}`);
    if (raw) {
      try {
        setMe(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [id, search.admin]);

  // Direct table subscriptions are intentionally denied; refresh the scoped shared-link read.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") qc.invalidateQueries({ queryKey: ["event", id] });
    };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [id, qc]);

  // Load my existing slots once identity is known
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!me || loadedFor.current === me.name.toLowerCase()) return;
    const existing = responses.find((r) => r.name.toLowerCase() === me.name.toLowerCase());
    setMine(new Set(existing?.slots ?? []));
    loadedFor.current = me.name.toLowerCase();
  }, [me, responses]);

  // Remember this poll in the device's "My polls" list.
  useEffect(() => {
    if (!ev?.title) return;
    recordPoll({ id, title: ev.title, expiresAt: ev.expires_at, name: me?.name, role: adminToken ? "creator" : "participant" });
  }, [id, ev?.title, ev?.expires_at, me?.name, adminToken]);

  const shape = useMemo(() => (ev ? buildGrid(ev) : null), [ev]);
  const tz = tzPick ?? viewerTz ?? ev?.timezone ?? "UTC";
  const tzOptions = useMemo(() => {
    const base = [
      "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Denver", "America/Chicago",
      "America/New_York", "America/Sao_Paulo", "Atlantic/Azores", "UTC", "Europe/London", "Europe/Paris",
      "Europe/Berlin", "Europe/Helsinki", "Europe/Athens", "Africa/Cairo", "Asia/Dubai", "Asia/Karachi",
      "Asia/Kolkata", "Asia/Bangkok", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney",
      "Pacific/Auckland",
    ];
    const extra = [viewerTz, ev?.timezone].filter((z): z is string => !!z);
    return [...new Set([...extra, ...base])];
  }, [viewerTz, ev?.timezone]);

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of responses) for (const s of r.slots) m.set(s, (m.get(s) ?? 0) + 1);
    return m;
  }, [responses]);

  const recs = useMemo(
    () => (shape && ev ? topTimes(shape.grid, ev.slot_minutes, responses, 3) : []),
    [shape, ev, responses],
  );

  const persist = useCallback(
    async (slots: Set<number>) => {
      if (!me || !ev) return;
      const arr = [...slots].sort((a, b) => a - b);
      // optimistic
      qc.setQueryData(eventQuery(id).queryKey, (old) => {
        if (!old) return old;
        const others = old.responses.filter((r) => r.name.toLowerCase() !== me.name.toLowerCase());
        const mineRow: ResponseRow = {
          id: old.responses.find((r) => r.name.toLowerCase() === me.name.toLowerCase())?.id ?? "local",
          name: me.name,
          slots: arr,
          updated_at: new Date().toISOString(),
        };
        return { ...old, responses: [...others, mineRow] };
      });
      setSaving(true);
      try {
        await save({ data: { event_id: id, name: me.name, pin: me.pin || undefined, slots: arr } });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save");
        qc.invalidateQueries({ queryKey: ["event", id] });
      } finally {
        setSaving(false);
      }
    },
    [me, ev, id, qc, save],
  );

  const mineRef = useRef(mine);
  mineRef.current = mine;
  const onPaintEnd = useCallback(() => persist(mineRef.current), [persist]);

  if (!ev || !shape) return <Gone title="We couldn't find that poll" body="The link may be mistyped or the poll was removed." />;
  if (now != null && isExpired(ev.expires_at, now))
    return <Gone title="This poll has expired" body="Polls close automatically 3 weeks after they're created to keep things tidy." />;

  const isAdmin = !!adminToken;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/e/${id}` : `/e/${id}`;
  const finalStart = ev.final_start ? Math.round(Date.parse(ev.final_start) / 60000) : null;
  const finalEnd = ev.final_end ? Math.round(Date.parse(ev.final_end) / 60000) : null;
  const activeNames = active != null ? responses.filter((r) => r.slots.includes(active)).map((r) => r.name) : [];
  const activeMissing = active != null ? responses.filter((r) => !r.slots.includes(active)).map((r) => r.name) : [];
  const daysLeft = now ? Math.max(0, Math.ceil((Date.parse(ev.expires_at) - now) / 86400000)) : null;

  async function doAdmin(action: "lock" | "close" | "reopen", start?: number, end?: number) {
    if (action === "close" && !adminToken) return;
    try {
      await admin({ data: { event_id: id, token: adminToken ?? undefined, action, start, end } });
      qc.invalidateQueries({ queryKey: ["event", id] });
      toast.success(action === "lock" ? "Final time locked in" : action === "close" ? "Poll closed" : "Poll reopened");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const copy = async (text: string, msg: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const tzLabel = `${tz.replace(/_/g, " ")}${tz === viewerTz ? " (you)" : tz === ev?.timezone ? " (organizer)" : ""}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => copy(shareUrl, "Link copied")}>
          <Copy /> Copy share link
        </Button>
      </header>

      <div className="rise-in mb-10">
        <p className="eyebrow">Poll — {ev.slot_minutes} min slots</p>
        <h1 className="mt-3 text-4xl leading-[0.95] tracking-[-0.045em] md:text-6xl">{ev.title}</h1>
        {ev.description && <p className="mt-4 max-w-2xl text-muted-foreground">{ev.description}</p>}
        <div className="eyebrow mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>{responses.length} responded</span>
          {daysLeft != null && (
            <span className="flex items-center gap-1">
              <Hourglass className="size-3" /> Link expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Globe className="size-3" />
            <label htmlFor="tzpick" className="sr-only">Show times in timezone</label>
            <span className="relative inline-grid">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap px-1.5 py-1.5 text-xs">
                {tzLabel}
                <span className="inline-block w-8" />
              </span>
              <select
                id="tzpick"
                value={tz}
                onChange={(e) => {
                  setTzPick(e.target.value);
                  localStorage.setItem(`overlap:tz:${id}`, e.target.value);
                }}
                className="absolute inset-0 h-full w-full min-w-0 appearance-none rounded-md border border-input bg-card px-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {tzOptions.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}{z === viewerTz ? " (you)" : z === ev.timezone ? " (organizer)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 opacity-70" />
            </span>
          </span>
        </div>
      </div>

      {finalStart != null && finalEnd != null && (
        <FinalCard id={id} title={ev.title} description={ev.description ?? ""} start={finalStart} end={finalEnd} tz={tz} onReopen={() => doAdmin("reopen")} names={responses.filter((r) => r.slots.includes(finalStart)).map((r) => r.name)} />
      )}
      {ev.closed && finalStart == null && (
        <div className="mb-6 flex items-center justify-between rounded-xl border bg-muted p-4 text-sm">
          <span className="flex items-center gap-2"><Lock className="size-4" /> The organizer closed this poll.</span>
          <Button size="sm" variant="outline" onClick={() => doAdmin("reopen")}>Reopen</Button>
        </div>
      )}

      <div className="grid items-start gap-6 md:grid-cols-2">
        <section className="min-w-0 border-t pt-5" aria-labelledby="your-availability">
          <p className="eyebrow mb-1">01–02 — You</p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="your-availability" className="text-2xl">Your availability</h2>
            {me && !ev.closed && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                {saving ? "Saving…" : "Saved"}
              </span>
            )}
          </div>
          {!ev.closed && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{me ? <Check className="size-3" /> : "1"}</span>
                <h3>{me ? `You're joining as ${me.name}` : "Enter your name"}</h3>
                {me && <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setMe(null); loadedFor.current = null; localStorage.removeItem(`overlap:me:${id}`); }}>Change name</Button>}
              </div>
              {!me && (
                <>
                  <p className="text-sm text-muted-foreground">No account needed. Enter your name to join this poll, then choose when you're free.</p>
                  <NameForm
                    pinRequired={responses.length === 0}
                    onSubmit={async (m) => {
                      const res = await check({ data: { event_id: id, name: m.name, pin: m.pin || undefined } });
                      if (!res.ok) throw new Error(m.pin ? "Wrong PIN for that name" : "That name has a PIN — enter it to edit");
                      localStorage.setItem(`overlap:me:${id}`, JSON.stringify(m));
                      setMe(m);
                    }}
                  />
                </>
              )}
              <div className="mb-3 mt-5 flex items-center gap-2 text-sm font-semibold">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs", me ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</span>
                <h3>Select your available times</h3>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{me ? `Click or drag across ${ev.slot_minutes}-minute blocks when you're free. Select separate blocks for breaks; changes save automatically.` : "Enter your name above to unlock time selection."}</p>
              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="bg-heat-0 size-3 rounded-sm border" /> Unavailable</span>
                <span className="flex items-center gap-1.5"><span className="paint-on size-3 rounded-sm" /> Available</span>
              </div>
              <div inert={!me} className={cn(!me && "opacity-50")}>
                <AvailabilityGrid grid={shape.grid} rows={shape.rows} slotMinutes={ev.slot_minutes} tz={tz} mode="paint" selected={me ? mine : new Set<number>()} onPaint={me ? setMine : undefined} onPaintEnd={me ? onPaintEnd : undefined} />
              </div>
            </>
          )}
          {ev.closed && <p className="py-8 text-center text-sm text-muted-foreground">Responses are closed. See the group's availability.</p>}
        </section>

        <section className="min-w-0 border-t pt-5" aria-labelledby="group-availability">
          <p className="eyebrow mb-1">03 — Group</p>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="group-availability" className="text-2xl">Group's availability</h2>
            <span className="eyebrow flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-highlight" /> Live</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground" role="status">{responses.length === 0 ? "Waiting for the first response. The group grid fills in as everyone selects their times." : `${responses.length} participant${responses.length === 1 ? " has" : "s have"} responded. Darker blocks mean more people are free.`}</p>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>0/{responses.length} available</span>
            {Array.from({ length: Math.max(responses.length, 1) + 1 }, (_, i) => (
              <div key={i} className="heat-cell h-3 w-5 rounded-sm" style={{ ["--level" as string]: responses.length ? i / responses.length : 0 }} />
            ))}
            <span>{responses.length}/{responses.length} available</span>
          </div>
          <AvailabilityGrid grid={shape.grid} rows={shape.rows} slotMinutes={ev.slot_minutes} tz={tz} mode="heat" counts={counts} total={responses.length} active={active} onActive={setActive} highlight={finalStart != null ? new Set(shape.grid.flat().filter((s) => s >= finalStart && s < (finalEnd ?? 0))) : undefined} />
          <div className="mt-4 border-t pt-3">
            {active == null ? (
              <p className="text-sm text-muted-foreground">Hover or tap a slot to see who's available.</p>
            ) : (
              <>
                <div className="mb-2 text-sm font-semibold">{fmtRange(active, active + ev.slot_minutes, tz)}</div>
                <p className="mb-3 text-sm tabular-nums">{activeNames.length} of {responses.length} available · {votePercentage(activeNames.length, responses.length)}%</p>
                <div className="grid grid-cols-2 gap-2">
                  <PeopleList label="Available" names={activeNames} ok />
                  <PeopleList label="Missing" names={activeMissing} />
                </div>
                {!ev.closed && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => doAdmin("lock", active, active + ev.slot_minutes)}>
                    <CalendarCheck /> Lock in this slot
                  </Button>
                )}
              </>
            )}
          </div>
          <PollResults grid={shape.grid} responses={responses} slotMinutes={ev.slot_minutes} tz={tz} />
        </section>
      </div>

      {recs.length > 0 && (
        <section className="mt-10 border-t pt-6">
          <p className="eyebrow mb-1">04 — Recommended</p>
          <h2 className="mb-4 flex items-center gap-2 text-2xl"><Trophy className="size-5" /> Top times</h2>
          <div className="grid border-t md:grid-cols-3 md:border-t-0">
            {recs.map((r, i) => (
              <div key={i} className={cn("flex gap-4 border-b py-4 md:border-b-0 md:border-l md:px-5 md:first:border-l-0 md:first:pl-0")}>
                <span className={cn("font-display text-4xl font-medium leading-none tabular-nums", i === 0 ? "text-highlight" : "text-muted-foreground")}>{i + 1}</span>
                <div className="min-w-0">
                <div className="text-sm font-semibold">{fmtRange(r.start, r.end, tz)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {r.count}/{responses.length} free · {votePercentage(r.count, responses.length)}% · {r.names.join(", ")}
                </div>
                {!ev.closed && (
                  <Button size="sm" variant={i === 0 ? "default" : "outline"} className="mt-3" onClick={() => doAdmin("lock", r.start, r.end)}>
                    <CalendarCheck /> Lock in
                  </Button>
                )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <aside className="contents">

          <Reminder id={id} title={ev.title} shareUrl={shareUrl} responded={responses.map((r) => r.name)} />
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <h3 className="mb-2 text-sm font-semibold">Responded ({responses.length})</h3>
            {responses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No one yet. Share the link!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {responses.map((r) => (
                  <span key={r.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{r.name}</span>
                ))}
              </div>
            )}
          </div>
          {isAdmin && !ev.closed && (
            <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
              <p className="mb-2"><strong className="text-foreground">You're the organizer.</strong> Anyone with the link can lock in or reopen a time. Only you can close the poll early.</p>
              <Button size="sm" variant="outline" onClick={() => doAdmin("close")}>
                <Lock /> Close poll early
              </Button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function PeopleList({ label, names, ok }: { label: string; names: string[]; ok?: boolean }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label} ({names.length})</div>
      {names.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {names.map((n) => (
            <li key={n} className="flex items-center gap-2">
              {ok ? <Check className="size-3.5 text-success" /> : <X className="size-3.5 text-muted-foreground" />} {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NameForm({ onSubmit, pinRequired }: { onSubmit: (m: Me) => Promise<void>; pinRequired?: boolean }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4 py-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (pinRequired && !pin) { toast.error("As the first to respond, please set a 4-digit PIN"); return; }
        if (pin && !/^\d{4}$/.test(pin)) { toast.error("PIN must be 4 digits"); return; }
        setBusy(true);
        try {
          await onSubmit({ name: name.trim(), pin });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Try again");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" required autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Alex" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pin">4-digit PIN <span className="font-normal text-muted-foreground">{pinRequired ? "(required — you're first to respond)" : "(optional, to edit later)"}</span></Label>
        <Input id="pin" inputMode="numeric" required={pinRequired} pattern="\d{4}" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} {busy ? "Joining…" : "Continue to time selection"}
      </Button>
    </form>
  );
}

function Reminder({ id, title, shareUrl, responded }: { id: string; title: string; shareUrl: string; responded: string[] }) {
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const raw = localStorage.getItem(`overlap:invitees:${id}`);
    if (raw) setNames(JSON.parse(raw));
  }, [id]);
  const update = (n: string[]) => {
    setNames(n);
    localStorage.setItem(`overlap:invitees:${id}`, JSON.stringify(n));
  };
  const done = new Set(responded.map((n) => n.toLowerCase()));
  const missing = names.filter((n) => !done.has(n.toLowerCase()));
  const text = `Hey ${missing.length ? missing.join(", ") : "all"}! 👋 Still need your availability for “${title}”. Takes 20 seconds: ${shareUrl}`;
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <h3 className="mb-2 text-sm font-semibold">Who haven't we heard from?</h3>
      <ul className="mb-2 space-y-1 text-sm">
        {names.map((n) => (
          <li key={n} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className={cn("grid size-4 place-items-center rounded border", done.has(n.toLowerCase()) && "border-primary bg-primary text-primary-foreground")}>
                {done.has(n.toLowerCase()) && <Check className="size-3" />}
              </span>
              <span className={cn(done.has(n.toLowerCase()) && "text-muted-foreground line-through")}>{n}</span>
            </span>
            <Button size="icon" variant="ghost" onClick={() => update(names.filter((x) => x !== n))} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${n}`}>
              <X className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          if (v && !names.includes(v)) update([...names, v]);
          setDraft("");
        }}
      >
        <Input aria-label="Invitee name" className="h-11 min-w-0 text-sm" placeholder="Add a name" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button size="sm" variant="outline" type="submit">Add</Button>
      </form>
      <Button
        size="sm"
        className="mt-3 w-full"
        disabled={names.length > 0 && missing.length === 0}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          toast.success("Reminder copied — paste it in your group chat");
        }}
      >
        <MessageSquareText /> {names.length > 0 && missing.length === 0 ? "Everyone's in!" : "Copy reminder"}
      </Button>
    </div>
  );
}

function FinalCard({ id, title, description, start, end, tz, onReopen, names }: { id: string; title: string; description: string; start: number; end: number; tz: string; onReopen: () => void; names: string[] }) {
  const details = description || `Scheduled with Overlap`;
  const downloadIcs = () => {
    const blob = new Blob([buildIcs(id, title, details, start, end)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\w]+/g, "-").toLowerCase() || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="mb-8 rounded-lg bg-band p-6 text-band-foreground md:p-8">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-band-muted"><span className="size-1.5 rounded-full bg-highlight" /> It's happening</div>
      <div className="mt-3 font-display text-3xl font-medium tracking-[-0.035em] md:text-4xl">{fmtRange(start, end, tz)}</div>
      {names.length > 0 && <div className="mt-1 text-sm opacity-80">With {names.join(", ")}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary">
          <a href={googleCalendarUrl(title, details, start, end)} target="_blank" rel="noreferrer">
            <CalendarCheck /> Add to Google Calendar
          </a>
        </Button>
        <Button size="sm" variant="secondary" onClick={downloadIcs}>
          <Download /> Outlook / Apple (.ics)
        </Button>
        <Button size="sm" variant="secondary" onClick={onReopen}>
          Reopen poll
        </Button>
      </div>
    </section>
  );
}

function Gone({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-muted">
          <Hourglass className="size-5 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button asChild className="mt-6">
          <Link to="/">Start a new poll</Link>
        </Button>
      </div>
    </main>
  );
}
