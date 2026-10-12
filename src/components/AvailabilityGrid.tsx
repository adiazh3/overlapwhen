import { useEffect, useRef } from "react";
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
  const drag = useRef<{ value: boolean; set: Set<number> } | null>(null);

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
    if (drag.current.value) s.add(slot);
    else s.delete(slot);
    onPaint?.(new Set(s));
  };

  const onDown = (e: React.PointerEvent) => {
    const slot = slotAt(e.clientX, e.clientY);
    if (slot == null) return;
    if (mode === "heat") {
      onActive?.(active === slot ? null : slot);
      return;
    }
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = { value: !selected?.has(slot), set: new Set(selected) };
    apply(slot);
  };

  const onMove = (e: React.PointerEvent) => {
    const slot = slotAt(e.clientX, e.clientY);
    if (mode === "heat") {
      if (e.pointerType === "mouse") onActive?.(slot);
      return;
    }
    if (drag.current && slot != null) apply(slot);
  };

  const hourStep = 60 / slotMinutes;

  return (
    <div className="overflow-x-auto pb-2">
      <div
        className={cn("grid-surface inline-grid gap-x-1", mode === "paint" ? "cursor-crosshair" : "cursor-pointer")}
        style={{ gridTemplateColumns: `3.75rem repeat(${grid.length}, minmax(2.75rem, 1fr))` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerLeave={(e) => mode === "heat" && e.pointerType === "mouse" && onActive?.(null)}
      >
        <div />
        {grid.map((col, d) => {
          const [wd, ...rest] = fmtDay(col[0], tz).split(", ");
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
              {r % hourStep === 0 ? fmtTime(grid[0][r], tz) : ""}
            </div>
            {grid.map((col, d) => {
              const slot = col[r];
              const isHour = (r + 1) % hourStep === 0;
              const on = mode === "paint" ? selected?.has(slot) : false;
              const level = mode === "heat" && total > 0 ? (counts?.get(slot) ?? 0) / total : 0;
              return (
                <div
                  key={d}
                  data-slot={slot}
                  className={cn(
                    "h-5 border-x border-t border-background transition-colors",
                    isHour && "border-b-border",
                    mode === "paint" ? (on ? "paint-on" : "bg-heat-0 hover:bg-accent") : "heat-cell",
                    highlight?.has(slot) && "outline-2 outline-offset-[-2px] outline-success",
                    active === slot && "outline-2 outline-offset-[-2px] outline-ring",
                  )}
                  style={mode === "heat" ? ({ ["--level" as string]: level } as React.CSSProperties) : undefined}
                />
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
