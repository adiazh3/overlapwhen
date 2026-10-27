/** A poll must contain at least one complete meeting-length block. */
export function creationWindowError(startMinute: number, endMinute: number, slotMinutes: number): string | null {
  if (endMinute <= startMinute) return "End time must be after start time";
  if (endMinute - startMinute < slotMinutes) return `Choose a time window of at least ${slotMinutes} minutes for this meeting length`;
  return null;
}