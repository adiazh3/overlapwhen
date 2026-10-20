import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

afterEach(cleanup);

describe("Button form behavior", () => {
  it("does not submit a form for a normal action", () => {
    const submit = vi.fn((event) => event.preventDefault());
    const action = vi.fn();
    render(<form onSubmit={submit}><Button onClick={action}>Action</Button></form>);
    fireEvent.click(screen.getByRole("button", { name: "Action" }));
    expect(action).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits when explicitly configured as a submit action", () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><Button type="submit">Submit</Button></form>);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(submit).toHaveBeenCalledOnce();
  });
});