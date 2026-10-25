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
});