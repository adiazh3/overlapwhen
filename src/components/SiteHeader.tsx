import { Link } from "@tanstack/react-router";
import { TutorialHelp } from "@/components/TutorialHelp";
import { useHistory } from "@/hooks/use-history";

/** Global top navigation bar: brand on the left, My polls + tutorial trigger on the right. */
export function SiteHeader() {
  const count = useHistory().length;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 md:px-6">
        <Link to="/" className="flex min-h-11 items-center gap-2 rounded-sm">
          <span className="size-2 rounded-full bg-highlight" aria-hidden />
          <span className="font-display text-lg font-medium tracking-tight">Overlap</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/history" className="eyebrow link-underline flex min-h-11 items-center gap-1.5 text-foreground">
            My polls
            {count > 0 && <span className="rounded-full border border-border px-1.5 text-[10px] tracking-normal">{count}</span>}
          </Link>
          <TutorialHelp />
        </div>
      </div>
    </header>
  );
}
