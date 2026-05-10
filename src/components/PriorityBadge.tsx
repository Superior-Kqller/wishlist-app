"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPriorityLabel } from "@/lib/priority-labels";
import { clampWishlistPriority, priorityBadgeToneByPriority } from "@/lib/priority-styles";
import { useI18n } from "@/components/i18n/language-provider";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { language, t } = useI18n();
  const normalizedPriority = clampWishlistPriority(priority);
  const label = getPriorityLabel(normalizedPriority, language);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 border text-xs font-medium",
        priorityBadgeToneByPriority[normalizedPriority],
        className
      )}
      data-testid="priority-badge"
      aria-label={`${t("Приоритет")}: ${label}`}
    >
      {label}
    </Badge>
  );
}
