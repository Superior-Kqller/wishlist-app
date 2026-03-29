"use client";

import { cn } from "@/lib/utils";
import { getPriorityLabel, getPriorityEmoji } from "@/lib/priority-labels";

function clampWishlistPriority(priority: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

const OVERLAY_BY_PRIORITY: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "border-primary/25 bg-primary/15 text-primary-foreground shadow-sm",
  2: "border-primary/32 bg-primary/22 text-primary-foreground shadow-sm",
  3: "border-primary/42 bg-primary/32 text-primary-foreground shadow-sm",
  4: "border-primary/55 bg-primary/44 text-primary-foreground shadow-sm",
  5: "border-primary/68 bg-primary/56 text-primary-foreground shadow-sm",
};

export interface PriorityBadgeOverlayProps {
  priority: number;
  className?: string;
}

export function PriorityBadgeOverlay({ priority, className }: PriorityBadgeOverlayProps) {
  const p = clampWishlistPriority(priority);
  const emoji = getPriorityEmoji(p);
  const label = getPriorityLabel(p);
  const styles = OVERLAY_BY_PRIORITY[p];

  return (
    <div
      data-testid="wishlist-card-priority"
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 max-w-[60%] rounded-lg border px-3 py-1.5 text-left text-[11px] font-semibold leading-snug backdrop-blur-sm sm:left-2.5 sm:top-2.5 sm:px-3.5 sm:py-2 sm:text-xs sm:leading-snug",
        "line-clamp-2 break-words [overflow-wrap:anywhere]",
        styles,
        className,
      )}
    >
      {emoji} {label}
    </div>
  );
}
