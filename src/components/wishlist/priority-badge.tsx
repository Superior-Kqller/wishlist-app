"use client";

import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";

function clampWishlistPriority(priority: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

/** Стили приоритета в рамках единого brand-акцента. */
const OVERLAY_BY_PRIORITY: Record<
  1 | 2 | 3 | 4 | 5,
  string
> = {
  1: "border-primary/32 bg-primary/12 text-primary-foreground shadow-sm",
  2: "border-primary/38 bg-primary/16 text-primary-foreground shadow-sm",
  3: "border-primary/44 bg-primary/20 text-primary-foreground shadow-sm",
  4: "border-primary/50 bg-primary/24 text-primary-foreground shadow-sm",
  5: "border-primary/56 bg-primary/28 text-primary-foreground shadow-sm",
};

export interface PriorityBadgeOverlayProps {
  priority: number;
  className?: string;
}

export function PriorityBadgeOverlay({ priority, className }: PriorityBadgeOverlayProps) {
  const p = clampWishlistPriority(priority);
  const label = getPriorityLabel(p);
  const styles = OVERLAY_BY_PRIORITY[p];

  return (
    <div
      data-testid="wishlist-card-priority"
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded-lg border px-3 py-1.5 text-left text-[11px] font-semibold leading-snug backdrop-blur-sm sm:left-2.5 sm:top-2.5 sm:px-3.5 sm:py-2 sm:text-xs sm:leading-snug",
        "line-clamp-2 break-words [overflow-wrap:anywhere]",
        styles,
        className,
      )}
    >
      {label}
    </div>
  );
}
