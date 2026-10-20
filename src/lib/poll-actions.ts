import { buildGrid, type EventShape } from "@/lib/slots";

export type PollAction = "lock" | "close" | "reopen";

export function validatePollAction(
  event: EventShape & { admin_token: string },
  input: { action: PollAction; token?: string | undefined; start?: number | undefined; end?: number | undefined },
) {
  if (input.action === "close" && event.admin_token !== input.token) {
    throw new Error("Only the organizer can close this poll early");
  }
  if (input.action !== "lock") return;
  const { start, end } = input;
  if (start == null || end == null || end <= start) throw new Error("Pick a time");
  const valid = buildGrid(event).grid.some((column) => {
    const index = column.indexOf(start);
    if (index < 0) return false;
    let boundary = start;
    for (const slot of column.slice(index)) {
      if (slot !== boundary) return false;
      boundary += event.slot_minutes;
      if (boundary === end) return true;
      if (boundary > end) return false;
    }
    return false;
  });
  if (!valid) throw new Error("Choose a time within this poll's available slots");
}