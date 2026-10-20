import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slotResults } from "@/lib/poll-results";
import { fmtRange } from "@/lib/slots";

type Props = {
  grid: number[][];
  responses: { slots: number[] }[];
  slotMinutes: number;
  tz: string;
};

export function PollResults({ grid, responses, slotMinutes, tz }: Props) {
  const [showAll, setShowAll] = useState(false);
  const results = useMemo(() => slotResults(grid, responses), [grid, responses]);
  if (!responses.length) return null;
  const visible = showAll ? results : results.slice(0, 5);

  return (
    <section className="mt-6 border-t pt-5" aria-labelledby="vote-results">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="vote-results" className="flex items-center gap-2 text-xl">
          <BarChart3 className="size-5" aria-hidden="true" /> Vote results
        </h3>
        <span className="text-sm font-semibold tabular-nums">{responses.length} participant{responses.length === 1 ? "" : "s"}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Percentage of participants available at each time. Each person can choose multiple times.</p>
      <div id="vote-result-bars" className={showAll ? "mt-4 max-h-96 overflow-y-auto pr-3" : "mt-4"}>
        <ol className="space-y-5">
          {visible.map((result) => {
            const label = fmtRange(result.start, result.start + slotMinutes, tz);
            return (
              <li key={result.start}>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="shrink-0 tabular-nums"><strong>{result.count}</strong> {result.count === 1 ? "vote" : "votes"} <span aria-hidden="true">·</span> <strong>{result.percentage}%</strong></span>
                </div>
                <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.percentage}
                  aria-valuetext={`${result.count} of ${responses.length} participants available (${result.percentage}%)`}
                  className="h-3 overflow-hidden rounded-sm bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${result.percentage}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {results.length > 5 && (
        <Button variant="outline" size="sm" className="mt-5" aria-expanded={showAll} aria-controls="vote-result-bars" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Show top 5" : `View all ${results.length} times`}
        </Button>
      )}
    </section>
  );
}