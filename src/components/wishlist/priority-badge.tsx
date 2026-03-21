"use client";

import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";

function clampWishlistPriority(priority: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

/** Стили согласованы с `PriorityBadge` (фиолетовый → розовый по мере роста срочности). */
const OVERLAY_BY_PRIORITY: Record<
  1 | 2 | 3 | 4 | 5,
  string
> = {
  1: "border-violet-400/55 bg-violet-950/88 text-violet-100 shadow-md shadow-violet-950/40",
  2: "border-violet-500/55 bg-violet-900/90 text-violet-50 shadow-md shadow-violet-950/35",
  3: "border-purple-400/60 bg-purple-950/90 text-purple-50 shadow-md shadow-purple-950/40",
  4: "border-fuchsia-400/65 bg-fuchsia-950/90 text-fuchsia-50 shadow-md shadow-fuchsia-950/35",
  5: "border-pink-400/70 bg-pink-950/92 text-pink-50 shadow-md shadow-pink-950/45",
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
