"use client";

import { Badge } from "@/components/ui/badge";
import {
  getItemStatusLabel,
  getItemStatusTone,
} from "@/lib/item-status-presentation";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";

type StatusBadgeProps = {
  status: ItemStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { language } = useI18n();

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1 text-xs", getItemStatusTone(status), className)}
    >
      {getItemStatusLabel(status, language)}
    </Badge>
  );
}
