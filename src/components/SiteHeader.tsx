import { Link } from "@tanstack/react-router";
import { CalendarClock, History } from "lucide-react";
import { TutorialHelp } from "@/components/TutorialHelp";
import { useHistory } from "@/hooks/use-history";

/** Global top navigation bar: brand on the left, My polls + tutorial trigger on the right. */
export function SiteHeader() {
  const count = useHistory().length;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-3.5" />
          </div>
          <span className="font-display text-base font-semibold">Overlap</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/history" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted">
            <History className="size-4" /> My polls
            {count > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span>}
          </Link>
          <TutorialHelp />
        </div>
      </div>
    </header>
  );
}
