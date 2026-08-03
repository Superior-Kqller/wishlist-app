"use client";

import { X } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  className?: string;
}

/**
 * Строка активных фильтров для широких экранов.
 *
 * На мобильном ту же роль играет счётчик на кнопке фильтров и drawer со
 * сбросом. На десктопе счётчика нет, и без этой строки единственным
 * признаком применённого фильтра оставалась укоротившаяся сетка — состояние
 * приходилось держать в голове.
 */
export function ActiveFilterChips({ chips, onClearAll, className }: ActiveFilterChipsProps) {
  const { t } = useI18n();

  if (chips.length === 0) return null;

  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}
      role="group"
      aria-label={t("Активные фильтры")}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-border/55 bg-[hsl(var(--surface-3)/0.62)] py-1 pl-2.5 pr-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          aria-label={`${t("Снять фильтр")}: ${chip.label}`}
        >
          <span className="min-w-0 truncate">{chip.label}</span>
          <X
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground"
            aria-hidden
          />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-0.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
      >
        {t("Сбросить всё")}
      </button>
    </div>
  );
}
