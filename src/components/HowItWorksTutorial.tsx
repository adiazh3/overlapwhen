import { useCallback, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, PenLine, Link2, MousePointerClick, Trophy, CalendarCheck, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Slide = { icon: LucideIcon; title: string; body: string; mock: ReactNode };

const cells = (on: number[]) => (
  <div className="grid grid-cols-6 gap-1">
    {Array.from({ length: 18 }, (_, i) => (
      <span key={i} className={`h-6 rounded-sm ${on.includes(i) ? "bg-primary" : "bg-muted"}`} />
    ))}
  </div>
);

const SLIDES: Slide[] = [
  {
    icon: PenLine,
    title: "Create a poll",
    body: "Add a title, pick dates on the calendar, set a daily time window and slot size. Takes about 15 seconds — no sign-up.",
    mock: (
      <div className="space-y-2">
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">Team dinner</div>
        <div className="flex flex-wrap gap-2">
          <span className="eyebrow rounded-full border border-border px-3 py-1">Oct 22 – 24</span>
          <span className="eyebrow rounded-full border border-border px-3 py-1">9 AM – 5 PM</span>
          <span className="eyebrow rounded-full bg-primary px-3 py-1 text-primary-foreground">30 min</span>
        </div>
      </div>
    ),
  },
  {
    icon: Link2,
    title: "Share the link",
    body: "Copy one link and drop it in your group chat or email. Links stay open for 21 days.",
    mock: (
      <div className="flex items-center justify-between gap-2 rounded-full border border-border bg-background py-1.5 pl-4 pr-1.5 text-sm">
        <span className="truncate">overlapwhen.com/e/k3x9</span>
        <span className="eyebrow flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-primary-foreground"><Check className="size-3" />Copied</span>
      </div>
    ),
  },
  {
    icon: MousePointerClick,
    title: "Mark availability",
    body: "Everyone enters their name and drags across the grid to paint when they're free. The first person sets a 4-digit PIN.",
    mock: (
      <div className="space-y-2">
        <span className="eyebrow">Alex · painting</span>
        {cells([1, 2, 7, 8, 9, 14])}
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Review top times",
    body: "Overlap layers every answer and ranks the top 3 times by who can make it — with names of who's in and who's missing.",
    mock: (
      <div className="space-y-2">
        {[["#1", "Wed 7:00 PM", "4/4 · 100%"], ["#2", "Thu 6:30 PM", "3/4 · 75%"]].map(([r, t, c], i) => (
          <div key={r} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${i === 0 ? "border-highlight" : "border-border"}`}>
            <span className="font-display text-lg">{r}</span><span>{t}</span><span className="eyebrow">{c}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: CalendarCheck,
    title: "Lock in the time",
    body: "Anyone with the link can lock in the winner (with a confirm step) or reopen it. Add it to Google Calendar or Outlook in one click.",
    mock: (
      <div className="rounded-md bg-band p-4 text-band-foreground">
        <span className="eyebrow text-band-muted">Locked in</span>
        <p className="mt-1 font-display text-xl">Wed, Oct 22 · 7:00 PM</p>
        <div className="mt-3 flex gap-2 text-xs"><span className="rounded-full border border-band-muted px-3 py-1">Google</span><span className="rounded-full border border-band-muted px-3 py-1">Outlook</span></div>
      </div>
    ),
  },
];

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

export function HowItWorksTutorial({ onFinish }: { onFinish?: (() => void) | undefined }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const reducedMotion = useReducedMotion();
  const last = SLIDES.length - 1;
  const go = useCallback((to: number) => {
    setState(([cur]) => (to < 0 || to > last || to === cur ? [cur, 0] : [to, to > cur ? 1 : -1]));
  }, [last]);
  const slide = SLIDES[index];
  if (!slide) return null;
  const Icon = slide.icon;

  return (
    <section aria-roledescription="carousel" aria-label="How Overlap works" onKeyDown={(e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(index + (e.key === "ArrowRight" ? 1 : -1)); }
    }} className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border px-5 py-5 md:px-8">
        <span className="eyebrow">How it works</span>
        <p className="mt-1 font-display text-2xl tracking-[-0.035em] md:text-3xl">Find the best time without endless group chats.</p>
      </div>
      <ol className="grid grid-cols-5 gap-1 px-5 pt-4 md:px-8" aria-label="Steps">
        {SLIDES.map((s, i) => (
          <li key={s.title}>
            <button type="button" onClick={() => go(i)} aria-current={i === index ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}`} className="w-full py-2 text-left">
              <span className={`block h-1 rounded-full transition-colors ${i <= index ? "bg-primary" : "bg-muted"}`} />
              <span className={`eyebrow mt-2 block ${i === index ? "text-foreground" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
            </button>
          </li>
        ))}
      </ol>
      <span className="sr-only" role="status">Step {index + 1} of {SLIDES.length}: {slide.title}</span>
      <div className="relative min-h-[380px] md:min-h-[260px]">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div key={index} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 p-5 md:grid-cols-2 md:gap-8 md:p-8">
            <div className="flex flex-col justify-center">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-border"><Icon className="h-4 w-4" /></span>
              <h2 className="font-display text-2xl md:text-3xl">{slide.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{slide.body}</p>
            </div>
            <div aria-hidden="true" className="flex flex-col justify-center rounded-xl border border-border bg-muted/40 p-5">{slide.mock}</div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-4 md:px-8">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous step" disabled={index === 0} onClick={() => go(index - 1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {index === last ? (
          <Button onClick={onFinish}>Start a poll</Button>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next step" onClick={() => go(index + 1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </section>
  );
}
