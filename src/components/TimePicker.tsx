import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const options = timeOptions(increment, includeMidnight);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const target = list.current?.querySelector<HTMLElement>(`[data-minute="${value}"]`);
      if (target && list.current) list.current.scrollTop = target.offsetTop - list.current.offsetTop - 80;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="h-10 w-full justify-between bg-card px-3" aria-label={`${label}: ${timeLabel(value)}`}>
          <span className="flex items-center gap-2"><Clock className="text-muted-foreground" />{timeLabel(value)}</span>
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-36 p-1">
        <div ref={list} role="listbox" aria-label={label} className="relative max-h-56 overflow-y-auto overscroll-contain">
          {options.map((minute) => (
            <Button key={minute} type="button" role="option" aria-selected={minute === value} data-minute={minute}
              variant={minute === value ? "secondary" : "ghost"} className="h-10 w-full justify-between px-3 tabular-nums"
              onClick={() => { onChange(minute); setOpen(false); }}>
              {timeLabel(minute)}{minute === value && <Check />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}