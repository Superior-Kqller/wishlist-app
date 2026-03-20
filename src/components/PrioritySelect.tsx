"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <Select
      value={String(priority)}
      onValueChange={(value) => onChange?.(Number(value))}
    >
      <SelectTrigger
        data-testid={triggerTestId}
        className="h-8 w-[80px] rounded-md bg-background px-2 text-xs font-medium"
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[1, 2, 3, 4, 5].map((value) => (
          <SelectItem key={value} value={String(value)}>
            P{value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
