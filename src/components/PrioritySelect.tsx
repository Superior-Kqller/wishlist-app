"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getPriorityEmoji, getPriorityLabel } from "@/lib/priority-labels";

interface PrioritySelectProps {
  priority: number;
  onChange?: (priority: number) => void;
  triggerTestId?: string;
  ariaLabel?: string;
}

export function PrioritySelect({
  priority,
  onChange,
  triggerTestId,
  ariaLabel = "Приоритет",
}: PrioritySelectProps) {
  const dotClassByPriority: Record<number, string> = {
    1: "bg-violet-300/80",
    2: "bg-violet-400/90",
    3: "bg-purple-500",
    4: "bg-fuchsia-500",
    5: "bg-pink-500",
  };

  const priorityDotClass = dotClassByPriority[priority] ?? "bg-violet-300/80";

  return (
    <Select
      value={String(priority)}
      onValueChange={(value) => onChange?.(Number(value))}
    >
      <SelectTrigger
        data-testid={triggerTestId}
        className="h-9 min-w-[92px] rounded-lg border-input/90 bg-card/65 px-2.5 text-xs font-semibold tracking-wide backdrop-blur-[10px]"
        aria-label={ariaLabel}
      >
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", priorityDotClass)}
        />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectItem key={value} value={String(value)}>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "h-2 w-2 rounded-full",
                  dotClassByPriority[value] ?? "bg-violet-300/80"
                )}
              />
              <span aria-hidden="true" className="text-sm leading-none">
                {getPriorityEmoji(value)}
              </span>
              <span>{getPriorityLabel(value)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
