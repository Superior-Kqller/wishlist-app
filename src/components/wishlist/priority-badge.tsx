"use client";

import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";
import { clampWishlistPriority } from "@/lib/priority-styles";
import { PriorityIcon } from "@/lib/priority-icons";
import { useI18n } from "@/components/i18n/language-provider";

export interface PriorityBadgeOverlayProps {
  priority: number;
  className?: string;
}

/**
 * Метка приоритета лежит поверх произвольной фотографии товара, поэтому
 * контраст текста не может зависеть от собственной светлоты оттенка: подложка
 * — плотный нейтральный тёмный, а оттенок приоритета живёт только в иконке и
 * тонкой рамке.
 *
 * Метка намеренно тихая. Раньше она была самым ярким пятном карточки —
 * крупная плашка с эмодзи и цветным свечением спорила с самим товаром,
 * ради которого карточка и существует.
 */
export function PriorityBadgeOverlay({ priority, className }: PriorityBadgeOverlayProps) {
  const { language } = useI18n();
  const p = clampWishlistPriority(priority);
  const label = getPriorityLabel(p, language);

  return (
    <div
      data-testid="wishlist-card-priority"
      className={cn(
        "pointer-events-none absolute left-2.5 top-2.5 z-10 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1.5",
        "rounded-full border border-white/16 bg-zinc-950/85 py-1 pl-1.5 pr-2.5 backdrop-blur-md",
        "text-[11px] font-medium leading-none text-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.34)]",
        className,
      )}
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full"
        style={{ color: `hsl(var(--priority-${p}))` }}
      >
        <PriorityIcon priority={p} className="size-3.5" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}
