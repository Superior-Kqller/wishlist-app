"use client";

import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={className}
      data-testid="priority-badge"
      aria-label={`Приоритет: P${priority}`}
    >
      P{priority}
    </Badge>
  );
}
