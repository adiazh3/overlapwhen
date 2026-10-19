import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useHistory } from "@/hooks/use-history";
import { recordPoll } from "@/lib/poll-history";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/lib/events.functions";
import { TimePicker } from "@/components/TimePicker";
import { type TimeIncrement } from "@/lib/time-picker";

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
  const recent = useHistory();
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
    if (endMinute <= startMinute) { toast.error("End time must be after start time"); return; }
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
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-5xl px-5 py-10 md:py-16">


      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <section className="md:pt-6">
          <h1 className="text-4xl font-semibold leading-[1.05] md:text-5xl">
            Find the time that works. Skip the group chat.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Create a poll in seconds, share the link, and everyone paints when they're free. No accounts, ever.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Users className="size-4 text-muted-foreground" /> Built for groups
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="size-4 text-muted-foreground" /> Top times picked for you automatically
            </li>
            <li className="flex items-center gap-3">
              <CalendarClock className="size-4 text-muted-foreground" /> Links tidy themselves up after 3 weeks
            </li>
          </ul>
          {recent.length > 0 && (
            <div className="mt-8 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Your recent polls</h2>
                <Link to="/history" className="text-xs underline">View all ({recent.length})</Link>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {recent.slice(0, 3).map((h) => (
                  <li key={h.id}>
                    <Link to="/e/$id" params={{ id: h.id }} className="flex justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted">
                      <span className="truncate">{h.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{h.role === "creator" ? "Organizer" : "Answered"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-10 flex gap-1" aria-hidden>
            {[0.08, 0.2, 0.4, 0.65, 1].map((l) => (
              <div key={l} className="heat-cell h-6 w-10 rounded" style={{ ["--level" as string]: l }} />
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-soft md:p-8">
          <div className="space-y-2">
            <Label htmlFor="title">What's the plan?</Label>
            <Input id="title" autoFocus placeholder="Team dinner, D&D night…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
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
                  <button type="button" className="ml-2 underline" onClick={() => setDays([])}>clear</button>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Tap any days you want — they don't need to be in a row.</p>
            <div className="flex justify-center rounded-lg border">
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
            <div className="flex gap-1 rounded-md bg-muted p-1" role="group" aria-label="Time increments">
              {([15, 60] as const).map((increment) => (
                <Button key={increment} type="button" size="sm" variant={timeIncrement === increment ? "outline" : "ghost"}
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
          <div className="grid grid-cols-2 gap-3">
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
            <Label>Slot size</Label>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
              {([15, 30, 45, 60] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`rounded-md py-1.5 text-sm font-medium transition ${slot === s ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                >
                  {s} min
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Times are in {tz}. Everyone sees them in their own timezone.</p>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Create poll
          </Button>
        </form>
      </div>
    </main>
  );
}
