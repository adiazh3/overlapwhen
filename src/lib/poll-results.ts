/** Each participant counts once per time; percentages use all submitted responses. */
export function votePercentage(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function slotResults(grid: number[][], responses: { slots: number[] }[]) {
  const counts = new Map<number, number>();
  for (const response of responses) {
    for (const slot of new Set(response.slots)) {
      counts.set(slot, (counts.get(slot) ?? 0) + 1);
    }
  }
  return [...new Set(grid.flat())]
    .map((start) => {
      const count = counts.get(start) ?? 0;
      return { start, count, percentage: votePercentage(count, responses.length) };
    })
    .sort((a, b) => b.count - a.count || a.start - b.start);
}