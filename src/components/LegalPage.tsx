import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 md:px-6 md:py-20">
      <p className="eyebrow">Legal — Last updated {updated}</p>
      <h1 className="display-xl mt-4">{title}</h1>
      <div className="mt-12 space-y-8 text-[15px] leading-relaxed text-foreground [counter-reset:sec] [&_h2]:mb-3 [&_h2]:border-t [&_h2]:pt-5 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:before:mr-3 [&_h2]:before:font-mono [&_h2]:before:text-xs [&_h2]:before:text-muted-foreground [&_h2]:before:content-[counter(sec,decimal-leading-zero)] [&_h2]:[counter-increment:sec] [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
        {children}
      </div>
    </main>
  );
}
