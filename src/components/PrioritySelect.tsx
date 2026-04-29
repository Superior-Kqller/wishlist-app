"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getPriorityLabel, getPriorityShortLabel } from "@/lib/priority-labels";
import { clampWishlistPriority, priorityDotClassByPriority } from "@/lib/priority-styles";

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
  const normalizedPriority = clampWishlistPriority(priority);
  const priorityDotClass = priorityDotClassByPriority[normalizedPriority];
  const currentLabel = compact
    ? getPriorityShortLabel(normalizedPriority)
    : getPriorityLabel(normalizedPriority);

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
                  priorityDotClassByPriority[clampWishlistPriority(value)]
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
