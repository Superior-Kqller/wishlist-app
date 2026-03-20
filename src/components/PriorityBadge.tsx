"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityEmoji, getPriorityLabel } from "@/lib/priority-labels";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const toneByPriority: Record<number, string> = {
    1: "border-violet-300/45 bg-violet-400/12 text-violet-100",
    2: "border-violet-400/45 bg-violet-500/14 text-violet-100",
    3: "border-purple-500/45 bg-purple-500/16 text-purple-100",
    4: "border-fuchsia-500/45 bg-fuchsia-500/18 text-fuchsia-100",
    5: "border-pink-500/45 bg-pink-500/20 text-pink-100",
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
      <span aria-hidden="true">{getPriorityEmoji(priority)}</span>
      {getPriorityLabel(priority)}
    </Badge>
  );
}
