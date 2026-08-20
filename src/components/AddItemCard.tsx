"use client";

import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface AddItemCardProps {
  onAdd: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

/**
 * Ячейка добавления — часть сетки, а не отдельный блок под ней: она занимает
 * ту же высоту и ту же геометрию, что и карточка желания, поэтому ряд
 * остаётся ровным, а действие оказывается там, где взгляд уже находится.
 */
export function AddItemCard({ onAdd, disabled, disabledHint }: AddItemCardProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      data-testid="add-item-card"
      aria-label={disabled ? (disabledHint ?? t("Добавление недоступно")) : t("Добавить желание")}
      disabled={disabled}
      onClick={onAdd}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "group/add flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl px-5 py-6 text-center",
        "border border-dashed border-border/55 bg-transparent",
        "transition-[border-color,background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-soft)]",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:-translate-y-1 hover:border-primary/45 hover:bg-primary/[0.06]",
        !disabled && uiState.focusVisible,
      )}
    >
      <span
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border/55 text-primary",
          "transition-[transform,border-color,background-color] duration-[var(--dur-base)] ease-[var(--ease-soft)]",
          !disabled && "group-hover/add:scale-110 group-hover/add:border-primary/55",
        )}
      >
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight text-foreground">
          {t("Добавить желание")}
        </span>
        <span className="mt-1 block max-w-[22ch] text-xs leading-snug text-muted-foreground">
          {t("По ссылке на товар или вручную.")}
        </span>
      </span>
    </button>
  );
}
