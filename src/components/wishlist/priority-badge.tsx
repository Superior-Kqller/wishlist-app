"use client";

import { cn } from "@/lib/utils";
import { clampWishlistPriority, getPriorityLabel, PriorityIcon } from "@/lib/priority";
import { useI18n } from "@/components/i18n/language-provider";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

/**
 * Важность в строке фактов карточки — значком и словом среди других фактов.
 *
 * Раньше на карточке со снимком она лежала плашкой поверх фотографии и
 * закрывала угол самого товара; в карточке без снимка ради неё держалась
 * пустая полоса высотой 60px. Теперь место у неё одно.
 */
export function PriorityBadgeInline({ priority, className }: PriorityBadgeProps) {
  const { language } = useI18n();
  const p = clampWishlistPriority(priority);
  const label = getPriorityLabel(p, language);

  return (
    <span
      data-testid="wishlist-card-priority"
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
    >
      <span
        className="flex size-3.5 shrink-0 items-center justify-center"
        style={{ color: `hsl(var(--priority-${p}))` }}
        aria-hidden
      >
        <PriorityIcon priority={p} className="size-3.5" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
