"use client";

import { cn } from "@/lib/utils";
import { getPriorityLabel, getPriorityEmoji } from "@/lib/priority-labels";
import { clampWishlistPriority, priorityOverlayToneByPriority } from "@/lib/priority-styles";

export interface PriorityBadgeOverlayProps {
  priority: number;
  className?: string;
}

export function PriorityBadgeOverlay({ priority, className }: PriorityBadgeOverlayProps) {
  const p = clampWishlistPriority(priority);
  const emoji = getPriorityEmoji(p);
  const label = getPriorityLabel(p);
  const styles = priorityOverlayToneByPriority[p];

  return (
    <div
      data-testid="wishlist-card-priority"
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 max-w-[60%] rounded-lg border px-3 py-1.5 text-left text-[11px] font-semibold leading-snug backdrop-blur-sm sm:left-2.5 sm:top-2.5 sm:px-3.5 sm:py-2 sm:text-xs sm:leading-snug",
        "line-clamp-2 break-words shadow-[0_10px_24px_rgba(0,0,0,0.34)] [overflow-wrap:anywhere]",
        styles,
        className,
      )}
    >
      {emoji} {label}
    </div>
  );
}
