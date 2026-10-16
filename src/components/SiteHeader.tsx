import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { TutorialHelp } from "@/components/TutorialHelp";

/** Global top navigation bar: brand on the left, tutorial trigger on the right. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-3.5" />
          </div>
          <span className="font-display text-base font-semibold">Overlap</span>
        </Link>
        <TutorialHelp />
      </div>
    </header>
  );
}
