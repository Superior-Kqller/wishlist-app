"use client";

import { cn } from "@/lib/utils";
import { uiState, uiSurface } from "@/lib/ui-contract";
import { Plus } from "lucide-react";
import { type KeyboardEvent } from "react";
import { useI18n } from "@/components/i18n/language-provider";

interface AddItemCardProps {
  onAdd: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

export function AddItemCard({ onAdd, disabled, disabledHint }: AddItemCardProps) {
  const { t } = useI18n();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAdd();
    }
  };

  return (
    <div
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? -1 : 0}
      data-testid="add-item-card"
      aria-label={disabled ? (disabledHint ?? t("Добавление недоступно")) : t("Добавить товар")}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onAdd}
      onKeyDown={disabled ? undefined : onKeyDown}
      title={disabled ? disabledHint : undefined}
      className={cn(
        "flex min-h-[132px] flex-col items-center justify-center gap-3 border-dashed p-4 text-center sm:min-h-[220px] sm:gap-4",
        uiSurface.contentPanel,
        "bg-[linear-gradient(135deg,hsl(var(--surface-2))/0.72,hsl(var(--surface-3))/0.52)]",
        disabled
          ? "cursor-not-allowed border-border/45 opacity-60"
          : "cursor-pointer border-border/50 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/34 hover:shadow-[0_14px_32px_rgba(0,0,0,0.24)]",
        !disabled && uiState.focusVisible,
      )}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/28 bg-primary/10 text-primary shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] sm:h-12 sm:w-12 sm:rounded-full">
        <Plus className="h-5 w-5" />
      </span>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold leading-tight sm:text-base">{t("Новый лот в коллекции")}</p>
        <p className="text-xs text-muted-foreground leading-snug sm:text-sm">
          {t("Добавьте товар по ссылке или заполните карточку вручную.")}
        </p>
      </div>
    </div>
  );
}
