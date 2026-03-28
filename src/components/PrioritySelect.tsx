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
  /** Крупнее точка приоритета (например, в карточке сетки) */
  prominentDot?: boolean;
}

export function PrioritySelect({
  priority,
  onChange,
  triggerTestId,
  ariaLabel = "Приоритет",
  compact = false,
  triggerClassName,
  prominentDot = false,
}: PrioritySelectProps) {
  const dotClassByPriority: Record<number, string> = {
    1: "bg-primary/45",
    2: "bg-primary/58",
    3: "bg-primary/70",
    4: "bg-primary/82",
    5: "bg-primary",
  };

  const priorityDotClass = dotClassByPriority[priority] ?? "bg-primary/45";
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
          "h-9 min-w-[92px] rounded-lg border-input bg-card px-2.5 text-xs font-semibold tracking-wide",
          compact && "h-8 min-w-0 text-[11px] w-fit max-w-full",
          compact && prominentDot && "h-9 text-xs",
          triggerClassName
        )}
        aria-label={ariaLabel}
      >
        <span
          aria-hidden="true"
          className={cn(
            "rounded-full",
            prominentDot ? "h-2.5 w-2.5" : "h-2 w-2",
            priorityDotClass
          )}
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
                  dotClassByPriority[value] ?? "bg-primary/45"
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
