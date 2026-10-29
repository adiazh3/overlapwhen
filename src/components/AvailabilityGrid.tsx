import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtDay, fmtTime } from "@/lib/slots";
import { cn } from "@/lib/utils";

type Props = {
  grid: number[][];
  rows: number;
  slotMinutes: number;
  tz: string;
  mode: "paint" | "heat";
  selected?: Set<number> | undefined;
  onPaint?: ((next: Set<number>) => void) | undefined;
  onPaintEnd?: (() => unknown) | undefined;
  counts?: Map<number, number> | undefined;
  total?: number | undefined;
  active?: number | null | undefined;
  highlight?: Set<number> | undefined;
  onActive?: ((slot: number | null) => void) | undefined;
};

export function AvailabilityGrid({
  grid,
  rows,
  slotMinutes,
  tz,
  mode,
  selected,
  onPaint,
  onPaintEnd,
  counts,
  total = 0,
  active,
  highlight,
  onActive,
}: Props) {
  const drag = useRef<{ value: boolean; set: Set<number>; last: number } | null>(null);
  const pointerType = useRef("");
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(grid.length / 5);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleGrid = grid.slice(safePage * 5, safePage * 5 + 5);

  useEffect(() => {
    const up = () => {
      if (drag.current) {
        drag.current = null;
        onPaintEnd?.();
      }
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [onPaintEnd]);

  const slotAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const v = el?.closest<HTMLElement>("[data-slot]")?.dataset["slot"];
    return v ? Number(v) : null;
  };

  const apply = (slot: number) => {
    if (!drag.current) return;
    const s = drag.current.set;
    // Fill skipped halves during fast vertical drags, never bridge separate days.
    const column = visibleGrid.find((col) => col.includes(slot) && col.includes(drag.current?.last ?? NaN));
    const between = column?.filter((time) => time >= Math.min(slot, drag.current?.last ?? slot) && time <= Math.max(slot, drag.current?.last ?? slot)) ?? [slot];
    for (const time of between) {
      if (drag.current.value) s.add(time);
      else s.delete(time);
    }
    drag.current.last = slot;
    onPaint?.(new Set(s));
  };

  const onDown = (e: React.PointerEvent) => {
    pointerType.current = e.pointerType;
    if (mode === "heat" || e.pointerType === "touch" || e.button !== 0 || !onPaint) return;
    const slot = slotAt(e.clientX, e.clientY);
    if (slot == null) return;
    e.preventDefault();
    (e.target as HTMLElement).closest<HTMLElement>("[data-slot]")?.focus({ preventScroll: true });
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = { value: !selected?.has(slot), set: new Set(selected), last: slot };
    apply(slot);
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const slot = slotAt(e.clientX, e.clientY);
    if (mode === "heat") return;
    if (drag.current && slot != null) apply(slot);
  };

  const minuteAt = (slot: number) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, minute: "2-digit" }).format(new Date(slot * 60000)));
  const toggle = (slot: number) => {
    if (mode === "heat") {
      onActive?.(active === slot ? null : slot);
      return;
    }
    const next = new Set(selected);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    onPaint?.(next);
    // Let the selected-state render commit before the parent reads its current set.
    setTimeout(() => onPaintEnd?.(), 0);
  };

  return (
    <div className="min-w-0 pb-2">
      {pageCount > 1 && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button size="icon" variant="outline" aria-label="Previous days" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft /></Button>
          <span className="text-xs text-muted-foreground" role="status">Days {safePage * 5 + 1}–{Math.min((safePage + 1) * 5, grid.length)} of {grid.length}</span>
          <Button size="icon" variant="outline" aria-label="Next days" disabled={safePage + 1 >= pageCount} onClick={() => setPage(safePage + 1)}><ChevronRight /></Button>
        </div>
      )}
      <div
        className={cn("grid w-full touch-pan-y gap-x-1 select-none", mode === "paint" ? "cursor-crosshair" : "cursor-pointer")}
        style={{ gridTemplateColumns: `3rem repeat(${visibleGrid.length}, minmax(0, 1fr))` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
      >
        <div />
        {visibleGrid.map((col, d) => {
          const [wd, ...rest] = fmtDay(col[0] ?? 0, tz).split(", ");
          return (
            <div key={d} className="pb-2 text-center leading-tight">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{wd}</div>
              <div className="text-xs font-semibold">{rest.join(", ")}</div>
            </div>
          );
        })}
        {Array.from({ length: rows }, (_, r) => (
          <Row key={r}>
            <div className="-mt-2 pr-2 text-right text-[10px] text-muted-foreground tabular-nums">
              {r === 0 || minuteAt(grid[0]?.[r] ?? 0) === 0 ? fmtTime(grid[0]?.[r] ?? 0, tz) : ""}
            </div>
            {visibleGrid.map((col, d) => {
              const slot = col[r] ?? 0;
              const isHour = minuteAt(slot + slotMinutes) === 0 || r === rows - 1;
              const on = mode === "paint" ? selected?.has(slot) : false;
              const level = mode === "heat" && total > 0 ? (counts?.get(slot) ?? 0) / total : 0;
              return (
                <Button
                  key={d}
                  decoration="none"
                  variant="ghost"
                  data-slot={slot}
                  className={cn(
                    "h-11 min-h-11 min-w-0 w-full rounded-none border-x border-t border-background p-0 transition-colors focus-visible:z-20 focus-visible:ring-inset",
                    slotMinutes === 30 && "half-hour-cell",
                    mode === "paint" && onPaint && "availability-snap",
                    isHour && "border-b border-b-border",
                    mode === "paint" ? (on ? "paint-on" : "bg-heat-0 hover:bg-accent") : "heat-cell",
                    highlight?.has(slot) && "outline-2 outline-offset-[-2px] outline-success",
                    mode === "heat" && active != null && active !== slot && "opacity-55",
                    active === slot && "slot-active",
                  )}
                  style={mode === "heat" ? ({ ["--level" as string]: level } as React.CSSProperties) : undefined}
                  aria-label={`${fmtDay(slot, tz)}, ${fmtTime(slot, tz)} to ${fmtTime(slot + slotMinutes, tz)}${mode === "heat" ? `, ${counts?.get(slot) ?? 0} of ${total} available` : ""}`}
                  aria-pressed={mode === "paint" ? !!on : active === slot}
                  onClick={(e) => { if (mode === "heat" || e.detail === 0 || pointerType.current === "touch") toggle(slot); }}
                  onKeyDown={(e) => {
                    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: visibleGrid.length, ArrowUp: -visibleGrid.length };
                    const offset = offsets[e.key];
                    if (offset == null) return;
                    e.preventDefault();
                    const cells = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[data-slot]");
                    const index = r * visibleGrid.length + d;
                    cells?.[index + offset]?.focus();
                  }}
                >
                  {(active === slot || on) && <Check className={cn("h-3.5 w-3.5", on && "text-primary-foreground")} strokeWidth={3} aria-hidden />}
                </Button>
              );
            })}
          </Row>
        ))}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
