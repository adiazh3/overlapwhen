import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharePoll } from "@/components/SharePoll";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("poll sharing handoff", () => {
  it("passes a participant link to the native share action", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<SharePoll title="Dinner" url="https://overlapwhen.com/e/example" message="Choose your availability" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "Dinner", text: "Choose your availability", url: "https://overlapwhen.com/e/example" }));
  });

  it("opens a manual fallback when native sharing fails", async () => {
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockRejectedValue(new Error("unsupported")) });
    render(<SharePoll title="Dinner" url="https://overlapwhen.com/e/example" message="Choose your availability" />);
    fireEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("dialog")).toBeVisible();
  });

  it("does not open another dialog when someone cancels native sharing", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    render(<SharePoll title="Dinner" url="https://overlapwhen.com/e/example" message="Choose your availability" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});