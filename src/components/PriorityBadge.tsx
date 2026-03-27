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
    1: "border-violet-300/35 bg-violet-500/8 text-violet-100/90",
    2: "border-violet-400/35 bg-violet-500/10 text-violet-100/90",
    3: "border-purple-400/35 bg-purple-500/10 text-purple-100/90",
    4: "border-fuchsia-400/35 bg-fuchsia-500/11 text-fuchsia-100/90",
    5: "border-pink-400/35 bg-pink-500/12 text-pink-100/90",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border text-xs font-medium backdrop-blur-[8px]",
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
