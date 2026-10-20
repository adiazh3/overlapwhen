import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-band text-band-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 pt-12 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <p className="max-w-xs text-sm text-band-muted">Group scheduling without the group chat. No accounts, ever.</p>
          <nav className="flex gap-6 font-mono text-[11px] uppercase tracking-[0.14em]">
            <Link to="/privacy" className="link-underline">Privacy</Link>
            <Link to="/terms" className="link-underline">Terms</Link>
            <Link to="/history" className="link-underline">My polls</Link>
          </nav>
        </div>
        <div aria-hidden="true" className="mt-10 select-none font-display text-[22vw] font-medium leading-[0.8] tracking-[-0.06em] opacity-10 md:text-[13rem]">
          Overlap
        </div>
        <div className="border-t border-band-muted/30 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-band-muted">
          © {new Date().getFullYear()} Overlap
        </div>
      </div>
    </footer>
  );
}
