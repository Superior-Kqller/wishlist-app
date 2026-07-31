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

export function AddItemCard({ onAdd, disabled, disabledHint }: AddItemCardProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      data-testid="add-item-card"
      aria-label={disabled ? (disabledHint ?? t("Добавление недоступно")) : t("Добавить товар")}
      disabled={disabled}
      onClick={onAdd}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "flex min-h-[7.5rem] self-start rounded-xl border border-dashed border-border/52 bg-transparent p-4 text-left text-muted-foreground",
        "items-center gap-3 transition-[border-color,background-color,color] duration-200",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
        !disabled && uiState.focusVisible,
      )}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-primary">
        <Plus className="h-5 w-5" />
      </span>
      <span className="min-w-0 space-y-1">
        <span className="block text-sm font-semibold leading-tight text-foreground">
          {t("Новый лот в коллекции")}
        </span>
        <span className="block text-xs leading-snug text-muted-foreground">
          {t("Добавьте товар по ссылке или заполните карточку вручную.")}
        </span>
      </span>
    </button>
  );
}
