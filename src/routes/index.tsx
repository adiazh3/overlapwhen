import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h: number) =>
  h === 0 || h === 24 ? "12:00 AM" : h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Index() {
  const navigate = useNavigate();
  const create = useServerFn(createEvent);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<Date[]>([]);
  const [today, setToday] = useState<Date | null>(null);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(21);
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
    if (endHour <= startHour) { toast.error("End time must be after start time"); return; }
    const dates = [...new Set(days.map(isoDate))].sort();
    setBusy(true);
    try {
      const res = await create({
        data: {
          title,
          description,
          start_date: dates[0]!,
          end_date: dates[dates.length - 1]!,
          dates,
          start_minute: startHour * 60,
          end_minute: endHour * 60,
          slot_minutes: slot,
          timezone: tz,
        },
      });
      localStorage.setItem(`overlap:admin:${res.id}`, res.admin_token);
      navigate({ to: "/e/$id", params: { id: res.id }, search: { admin: res.admin_token } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the event");
      setBusy(false);
    }
  }

  const selectCls =
    "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 md:py-16">
      <header className="mb-10 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <CalendarClock className="size-4" />
        </div>
        <span className="font-display text-lg font-semibold">Overlap</span>
      </header>

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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sh">No earlier than</Label>
              <select id="sh" className={selectCls} value={startHour} onChange={(e) => setStartHour(+e.target.value)}>
                {HOURS.slice(0, 24).map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eh">No later than</Label>
              <select id="eh" className={selectCls} value={endHour} onChange={(e) => setEndHour(+e.target.value)}>
                {HOURS.slice(1).map((h) => (
                  <option key={h} value={h}>{hourLabel(h)}</option>
                ))}
              </select>
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
