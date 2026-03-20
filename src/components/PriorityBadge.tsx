"use client";

import { Badge } from "@/components/ui/badge";
import { getPriorityEmoji, getPriorityLabel } from "@/lib/priority-labels";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className ?? ""}`}
      data-testid="priority-badge"
      aria-label={`Приоритет: ${getPriorityLabel(priority)}`}
    >
      <span aria-hidden="true">{getPriorityEmoji(priority)}</span>
      {getPriorityLabel(priority)}
    </Badge>
  );
}
