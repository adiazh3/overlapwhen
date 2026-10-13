export type TimeIncrement = 15 | 60;

export function timeOptions(increment: TimeIncrement, includeMidnight = false): number[] {
  return Array.from({ length: 1440 / increment + (includeMidnight ? 1 : 0) }, (_, i) => i * increment);
}

export function timeLabel(minute: number): string {
  const hour = Math.floor(minute / 60) % 24;
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}