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
        "flex min-h-[220px] flex-col items-center justify-center gap-4 border-dashed p-4 text-center sm:min-h-[240px]",
        uiSurface.contentPanel,
        "bg-[linear-gradient(135deg,hsl(var(--surface-2))/0.72,hsl(var(--surface-3))/0.58)]",
        disabled
          ? "cursor-not-allowed border-border/45 opacity-60"
          : "cursor-pointer border-border/50 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_18px_42px_rgba(0,0,0,0.32),0_0_0_1px_hsl(var(--primary)/0.14)]",
        !disabled && uiState.focusVisible,
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/45 bg-primary/16 text-primary shadow-[0_10px_24px_rgba(0,0,0,0.28),0_0_18px_hsl(var(--primary)/0.18)]">
        <Plus className="h-5 w-5" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold leading-tight">{t("Новый лот в коллекции")}</p>
        <p className="text-sm text-muted-foreground leading-snug">
          {t("Добавьте товар по ссылке или заполните карточку вручную.")}
        </p>
      </div>
    </div>
  );
}
