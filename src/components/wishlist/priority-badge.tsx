"use client";

import { cn } from "@/lib/utils";
import type { WishCardPriorityTier } from "@/lib/wish-card-priority";

export const PRIORITY_CONFIG: Record<
  WishCardPriorityTier,
  { label: string; className: string }
> = {
  URGENT: {
    label: "Очень хочу",
    className: "bg-red-500/85 text-white shadow-sm",
  },
  NORMAL: {
    label: "Неплохо бы",
    className: "bg-amber-500/85 text-amber-950 shadow-sm",
  },
  SOMEDAY: {
    label: "Когда-нибудь",
    className: "bg-slate-500/70 text-white shadow-sm",
  },
};

export interface PriorityBadgeOverlayProps {
  tier: WishCardPriorityTier;
  className?: string;
}

export function PriorityBadgeOverlay({ tier, className }: PriorityBadgeOverlayProps) {
  const cfg = PRIORITY_CONFIG[tier];
  return (
    <div
      data-testid="wishlist-card-priority"
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-md px-2 py-0.5 text-[11px] font-semibold leading-tight backdrop-blur-[2px]",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </div>
  );
}
