"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { type KeyboardEvent } from "react";

interface AddItemCardProps {
  onAdd: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

export function AddItemCard({ onAdd, disabled, disabledHint }: AddItemCardProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAdd();
    }
  };

  return (
    <Card
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? -1 : 0}
      data-testid="add-item-card"
      aria-label={disabled ? (disabledHint ?? "Добавление недоступно") : "Добавить товар"}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onAdd}
      onKeyDown={disabled ? undefined : onKeyDown}
      title={disabled ? disabledHint : undefined}
      className={
        disabled
          ? "flex min-h-[220px] cursor-not-allowed flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/45 bg-card p-4 text-center opacity-60 sm:min-h-[240px]"
          : "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-card p-4 text-center transition-colors hover:border-primary/35 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-[240px]"
      }
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/45 bg-primary/16 text-primary shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
        <Plus className="h-5 w-5" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold leading-tight">Новый лот в коллекции</p>
        <p className="text-sm text-muted-foreground leading-snug">
          Добавьте товар по ссылке или заполните карточку вручную.
        </p>
      </div>
    </Card>
  );
}
