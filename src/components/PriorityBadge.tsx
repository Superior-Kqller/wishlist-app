"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";
import { clampWishlistPriority, priorityBadgeToneByPriority } from "@/lib/priority-styles";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const normalizedPriority = clampWishlistPriority(priority);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border text-xs font-medium",
        priorityBadgeToneByPriority[normalizedPriority],
        className
      )}
      data-testid="priority-badge"
      aria-label={`Приоритет: ${getPriorityLabel(normalizedPriority)}`}
    >
      {getPriorityLabel(normalizedPriority)}
    </Badge>
  );
}
