"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const toneByPriority: Record<number, string> = {
    1: "border-primary/28 bg-primary/10 text-primary-foreground",
    2: "border-primary/34 bg-primary/14 text-primary-foreground",
    3: "border-primary/40 bg-primary/18 text-primary-foreground",
    4: "border-primary/46 bg-primary/22 text-primary-foreground",
    5: "border-primary/52 bg-primary/26 text-primary-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border text-xs font-medium",
        toneByPriority[priority] ?? toneByPriority[1],
        className
      )}
      data-testid="priority-badge"
      aria-label={`Приоритет: ${getPriorityLabel(priority)}`}
    >
      {getPriorityLabel(priority)}
    </Badge>
  );
}
