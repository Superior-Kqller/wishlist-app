"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getPriorityLabel, getPriorityShortLabel } from "@/lib/priority-labels";

interface PrioritySelectProps {
  priority: number;
  onChange?: (priority: number) => void;
  triggerTestId?: string;
  ariaLabel?: string;
  compact?: boolean;
  triggerClassName?: string;
}

export function PrioritySelect({
  priority,
  onChange,
  triggerTestId,
  ariaLabel = "Приоритет",
  compact = false,
  triggerClassName,
}: PrioritySelectProps) {
  const dotClassByPriority: Record<number, string> = {
    1: "bg-violet-300/80",
    2: "bg-violet-400/90",
    3: "bg-purple-500",
    4: "bg-fuchsia-500",
    5: "bg-pink-500",
  };

  const priorityDotClass = dotClassByPriority[priority] ?? "bg-violet-300/80";
  const currentLabel = compact
    ? getPriorityShortLabel(priority)
    : getPriorityLabel(priority);

  return (
    <Select
      value={String(priority)}
      onValueChange={(value) => onChange?.(Number(value))}
    >
      <SelectTrigger
        data-testid={triggerTestId}
        className={cn(
          "h-9 min-w-[92px] rounded-lg border-input/90 bg-card/65 px-2.5 text-xs font-semibold tracking-wide backdrop-blur-[10px]",
          compact && "h-8 min-w-[126px] text-[11px]",
          triggerClassName
        )}
        aria-label={ariaLabel}
      >
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", priorityDotClass)}
        />
        <span className="truncate">{currentLabel}</span>
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
              <span>{compact ? getPriorityShortLabel(value) : getPriorityLabel(value)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
