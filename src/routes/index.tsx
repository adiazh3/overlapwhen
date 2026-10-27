import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSyncedHistory } from "@/hooks/use-synced-history";
import { recordPoll } from "@/lib/poll-history";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarClock, Check, Loader2, Users, Sparkles, Share2 } from "lucide-react";

const PREVIEW_LEVELS = [
  [0.1, 0.3, 0.5, 0.3, 0.1],
  [0.3, 0.75, 1, 0.5, 0.15],
  [0.15, 0.5, 0.75, 0.3, 0.06],
  [0.06, 0.15, 0.3, 0.15, 0.06],
];

/** Decorative mock of a group heatmap with a recommended pick. */
function HeroPreview() {
  return (
    <div aria-hidden className="w-full max-w-sm rounded-lg border bg-card p-4 shadow-soft md:w-80">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Group availability</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-highlight" /> Live
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1">
        {PREVIEW_LEVELS.flatMap((row, r) =>
          row.map((l, c) => (
            <div
              key={`${r}-${c}`}
              className={`heat-cell h-7 rounded-sm ${l === 1 ? "ring-2 ring-highlight ring-offset-2 ring-offset-card" : ""}`}
              style={{ ["--level" as string]: l }}
            />
          )),
        )}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-md bg-primary p-3 text-primary-foreground">
        <span className="grid size-7 place-items-center rounded-full bg-highlight"><Check className="size-4" /></span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-75">Best pick · 5/5 free</p>
          <p className="text-sm font-medium">Wed · 7:00 PM</p>
        </div>
      </div>
    </div>
  );
}
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/lib/events.functions";
import { TimePicker } from "@/components/TimePicker";
import { type TimeIncrement } from "@/lib/time-picker";
import { creationWindowError } from "@/lib/creation-window";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overlap — find a time that works for your group" },
      { name: "description", content: "Create a scheduling poll in 15 seconds. No sign-up. Built for groups of 3–6." },
      { property: "og:title", content: "Overlap — find a time that works" },
      { property: "og:description", content: "No sign-up group scheduling. Paint your availability, see the overlap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Index() {
  const navigate = useNavigate();
  const { list: recent } = useSyncedHistory(3);
  const create = useServerFn(createEvent);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<Date[]>([]);
  const [today, setToday] = useState<Date | null>(null);
  const [startMinute, setStartMinute] = useState(540);
  const [endMinute, setEndMinute] = useState(1260);
  const [timeIncrement, setTimeIncrement] = useState<TimeIncrement>(15);
  const [slot, setSlot] = useState<15 | 30 | 45 | 60>(30);
  const [tz, setTz] = useState("UTC");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setToday(now);
    setDays(Array.from({ length: 5 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Give your event a name"); return; }
    if (days.length === 0) { toast.error("Pick at least one day"); return; }
    const windowError = creationWindowError(startMinute, endMinute, slot);
    if (windowError) { toast.error(windowError); return; }
    const dates = [...new Set(days.map(isoDate))].sort();
    const firstDate = dates[0];
    const lastDate = dates.at(-1);
    if (!firstDate || !lastDate) return;
    setBusy(true);
    try {
      const res = await create({
        data: {
          title,
          description,
          start_date: firstDate,
          end_date: lastDate,
          dates,
          start_minute: startMinute,
          end_minute: endMinute,
          slot_minutes: slot,
          timezone: tz,
        },
      });
      localStorage.setItem(`overlap:admin:${res.id}`, res.admin_token);
      recordPoll({ id: res.id, title: title.trim(), role: "creator", expiresAt: new Date(Date.now() + 21 * 86400000).toISOString() });
      navigate({ to: "/e/$id", params: { id: res.id }, search: { admin: res.admin_token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the event");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-5 pb-20 pt-10 md:px-6 md:pt-20">
      <section className="rise-in">
        <p className="eyebrow">Group scheduling — No accounts</p>
        <h1 className="display-xl mt-5 max-w-4xl">Find the time that works. Skip the group chat.</h1>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p className="text-muted-foreground">
              Create a poll in seconds, share the link, and everyone paints when they're free.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  document.getElementById("title")?.focus({ preventScroll: true });
                  document.getElementById("create-poll")?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
                }}
              >
                Start a poll
              </Button>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-highlight" />
                </span>
                15-sec setup · No sign-up
              </span>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <ol className="mt-14 grid gap-3 md:grid-cols-3">
        {[
          ["01", "Create", "Pick days and a time window.", CalendarClock],
          ["02", "Share", "Send one link. No sign-ups.", Share2],
          ["03", "Overlap", "Top times are picked for you.", Sparkles],
        ].map(([n, t, d, Icon]) => {
          const I = Icon as typeof Sparkles;
          return (
            <li key={n as string} className="group rounded-lg border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-highlight/50">
              <div className="flex items-center justify-between">
                <span className="eyebrow">{n as string}</span>
                <span className="grid size-9 place-items-center rounded-full bg-muted text-foreground transition group-hover:bg-highlight group-hover:text-primary-foreground">
                  <I className="size-4" aria-hidden />
                </span>
              </div>
              <h2 className="mt-4 text-2xl">{t as string}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <section className="min-w-0">
          <p className="eyebrow">Start a poll</p>
          <h2 className="mt-3 text-3xl md:text-4xl">Takes about fifteen seconds.</h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3"><Users className="size-4" /> Built for groups</li>
            <li className="flex items-center gap-3"><Sparkles className="size-4" /> Top times picked automatically</li>
            <li className="flex items-center gap-3"><CalendarClock className="size-4" /> Links tidy themselves up after 3 weeks</li>
          </ul>
          {recent.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="eyebrow">Your recent polls</span>
                <Link to="/history" className="eyebrow link-underline text-foreground">View all ({recent.length})</Link>
              </div>
              <ul>
                {recent.slice(0, 3).map((h) => (
                  <li key={h.id} className="border-b border-border">
                    <Link to="/e/$id" params={{ id: h.id }} className="flex justify-between gap-2 py-3 text-sm hover:text-highlight">
                      <span className="truncate">{h.title}</span>
                      <span className="eyebrow shrink-0">{h.role === "creator" ? "Organizer" : "Answered"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <form id="create-poll" onSubmit={submit} className="min-w-0 scroll-mt-20 space-y-5 rounded-lg border bg-card p-4 shadow-soft sm:p-6 md:p-8">
          <div className="space-y-2">
            <Label htmlFor="title">What's the plan?</Label>
            <Input id="title" placeholder="Team dinner, D&D night…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">
              Details <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>Which days?</Label>
              <span className="text-xs text-muted-foreground">
                {days.length} selected{days.length > 0 && (
                  <Button type="button" variant="link" size="sm" className="ml-2" onClick={() => setDays([])}>clear</Button>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Tap any days you want — they don't need to be in a row.</p>
            <div className="rounded-lg border">
              <Calendar
                mode="multiple"
                selected={days}
                onSelect={(d) => setDays((d ?? []).slice(0, 31))}
                disabled={{ before: today ?? new Date(0) }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Time increments</Label>
            <div className="flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Time increments">
              {([15, 60] as const).map((increment) => (
                <Button key={increment} type="button" size="sm" className="rounded-full" variant={timeIncrement === increment ? "outline" : "ghost"}
                  aria-pressed={timeIncrement === increment} onClick={() => {
                    setTimeIncrement(increment);
                    if (increment === 60) {
                      setStartMinute(Math.floor(startMinute / 60) * 60);
                      setEndMinute(Math.ceil(endMinute / 60) * 60);
                    }
                  }}>
                  {increment === 15 ? "15 min" : "1 hour"}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sh">No earlier than</Label>
              <TimePicker id="sh" label="No earlier than" value={startMinute} onChange={setStartMinute} increment={timeIncrement} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eh">No later than</Label>
              <TimePicker id="eh" label="No later than" value={endMinute} onChange={setEndMinute} increment={timeIncrement} includeMidnight />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Meeting length</Label>
            <div className="grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
              {([15, 30, 45, 60] as const).map((s) => (
                <Button
                  type="button"
                  key={s}
                  decoration="none"
                  size="sm"
                  variant={slot === s ? "secondary" : "ghost"}
                  aria-pressed={slot === s}
                  onClick={() => setSlot(s)}
                  className={`rounded-full py-1.5 text-sm font-medium text-foreground transition ${slot === s ? "bg-card shadow-soft" : ""}`}
                >
                  {s} min
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Recommendations use this length for each meeting option.</p>
          </div>
          <p className="text-xs text-muted-foreground">Times are in {tz}. Everyone sees them in their own timezone.</p>
          {creationWindowError(startMinute, endMinute, slot) && <p role="alert" className="text-sm text-destructive">{creationWindowError(startMinute, endMinute, slot)}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !today || !!creationWindowError(startMinute, endMinute, slot)}>
            {busy && <Loader2 className="animate-spin" />} Create poll
          </Button>
        </form>
      </div>
    </main>
  );
}
