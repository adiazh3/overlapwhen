import { Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timeLabel, timeOptions, type TimeIncrement } from "@/lib/time-picker";

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  increment: TimeIncrement;
  includeMidnight?: boolean;
};

export function TimePicker({ id, label, value, onChange, increment, includeMidnight = false }: Props) {
  const options = timeOptions(increment, includeMidnight);
  return (
    <Select value={String(value)} onValueChange={(selected) => onChange(Number(selected))}>
      <SelectTrigger id={id} className="min-h-11 w-full bg-card" aria-label={`${label}: ${timeLabel(value)}`}>
        <span className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-64">
        {options.map((minute) => (
          <SelectItem key={minute} value={String(minute)} className="min-h-11 tabular-nums">
            {timeLabel(minute)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
