import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Layers, Users, CalendarCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import discoverMedia from "@/assets/tutorial-discover.mp4.asset.json";
import conflictsMedia from "@/assets/tutorial-conflicts.mp4.asset.json";
import resolveMedia from "@/assets/tutorial-resolve.mp4.asset.json";

type Slide = { icon: LucideIcon; step: string; title: string; body: string; media: string };

const SLIDES: Slide[] = [
  {
    icon: Layers,
    step: "Step 1",
    title: "Discovering Overlaps",
    body: "Everyone paints the times they're free — no sign-up needed. Overlap layers each answer together so the best windows light up instantly.",
    media: discoverMedia.url,
  },
  {
    icon: Users,
    step: "Step 2",
    title: "Managing Conflicts",
    body: "Tap any time to see who's in and who's missing. Spot the gaps at a glance and nudge the people you haven't heard from yet.",
    media: conflictsMedia.url,
  },
  {
    icon: CalendarCheck,
    step: "Step 3",
    title: "Resolving and Syncing",
    body: "Lock in the winning time with one click. Everyone gets a summary with Google Calendar and Outlook links, ready to go.",
    media: resolveMedia.url,
  },
];

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

export function HowItWorksTutorial({ onFinish }: { onFinish?: (() => void) | undefined }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const last = SLIDES.length - 1;
  const go = useCallback((to: number) => {
    setState(([cur]) => (to < 0 || to > last || to === cur ? [cur, 0] : [to, to > cur ? 1 : -1]));
  }, [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const slide = SLIDES[index]!;
  const Icon = slide.icon;

  return (
    <section aria-roledescription="carousel" aria-label="How Overlap works" className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
      <div className="relative min-h-[520px] md:min-h-[360px]">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 p-5 md:grid-cols-2 md:gap-10 md:p-8"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-secondary shadow-inner">
              {slide.media ? (
                <img src={slide.media} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-md">
                    <Play className="h-6 w-6 translate-x-0.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider">Video / GIF placeholder</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{slide.step} of {SLIDES.length}</span>
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{slide.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{slide.body}</p>
              {index === last && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
                  <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20" onClick={onFinish}>
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-4 md:px-8">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous slide" disabled={index === 0} onClick={() => go(index - 1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-primary" : "w-2 bg-border hover:bg-muted-foreground"}`}
            />
          ))}
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next slide" disabled={index === last} onClick={() => go(index + 1)}>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
