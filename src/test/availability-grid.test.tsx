import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";

afterEach(cleanup);
const start = Date.UTC(2026, 9, 26, 9) / 60000;

describe("availability interaction", () => {
  it("lets keyboard activation select and then clear a personal time", async () => {
    const saved = vi.fn();
    let selection = new Set<number>();
    function Personal() {
      const [slots, setSlots] = useState(new Set<number>());
      selection = slots;
      return <AvailabilityGrid grid={[[start]]} rows={1} slotMinutes={30} tz="UTC" mode="paint" selected={slots} onPaint={setSlots} onPaintEnd={() => saved([...selection])} />;
    }
    render(<Personal />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(saved).toHaveBeenLastCalledWith([start]));
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(saved).toHaveBeenLastCalledWith([]));
  });

  it("keeps group selection until the same time is activated again", () => {
    const selected = vi.fn();
    const props = { grid: [[start]], rows: 1, slotMinutes: 30, tz: "UTC", mode: "heat" as const, onActive: selected };
    const { rerender } = render(<AvailabilityGrid {...props} />);
    fireEvent.click(screen.getByRole("button"));
    expect(selected).toHaveBeenLastCalledWith(start);
    rerender(<AvailabilityGrid {...props} active={start} />);
    fireEvent.click(screen.getByRole("button"));
    expect(selected).toHaveBeenLastCalledWith(null);
  });

  it.each([[17 * 60 + 30, 18 * 60 + 30], [9 * 60, 10 * 60 + 30], [14 * 60 + 30, 16 * 60]])("selects minute %i to %i precisely in half-hour cells", async (from, to) => {
    const midnight = Date.UTC(2026, 9, 26) / 60000;
    const saved = vi.fn();
    let selection = new Set<number>();
    function Personal() {
      const [slots, setSlots] = useState(new Set<number>());
      selection = slots;
      return <AvailabilityGrid grid={[Array.from({ length: 48 }, (_, i) => midnight + i * 30)]} rows={48} slotMinutes={30} tz="UTC" mode="paint" selected={slots} onPaint={setSlots} onPaintEnd={() => saved([...selection])} />;
    }
    const { container } = render(<Personal />);
    for (let minute = from; minute < to; minute += 30) {
      const cell = container.querySelector(`[data-slot="${midnight + minute}"]`);
      if (!cell) throw new Error("Missing half-hour cell");
      fireEvent.click(cell);
    }
    await waitFor(() => expect(saved).toHaveBeenLastCalledWith(Array.from({ length: (to - from) / 30 }, (_, i) => midnight + from + i * 30)));
  });

  it("fills skipped halves on a fast mouse drag without selecting the end boundary", () => {
    const paint = vi.fn();
    const finish = vi.fn();
    const { container } = render(<AvailabilityGrid grid={[[start, start + 30, start + 60, start + 90]]} rows={4} slotMinutes={30} tz="UTC" mode="paint" onPaint={paint} onPaintEnd={finish} />);
    const cells = container.querySelectorAll("[data-slot]");
    const hit = vi.spyOn(document, "elementFromPoint").mockReturnValue(cells[0] ?? null);
    const pointer = (type: string, target: Element) => {
      const event = new Event(type, { bubbles: true });
      Object.assign(event, { pointerType: "mouse", button: 0, clientX: 10, clientY: 10 });
      fireEvent(target, event);
    };
    const first = cells[0];
    const third = cells[2];
    if (!first || !third) throw new Error("Missing cells");
    pointer("pointerdown", first);
    hit.mockReturnValue(third);
    pointer("pointermove", third);
    fireEvent.pointerUp(window);
    expect([...paint.mock.lastCall?.[0]]).toEqual([start, start + 30, start + 60]);
    expect(finish).toHaveBeenCalledOnce();
    hit.mockRestore();
  });
});