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
          ? "flex min-h-[240px] cursor-not-allowed flex-col items-start justify-between gap-6 rounded-xl border border-dashed border-border/45 bg-card p-4 opacity-60"
          : "flex min-h-[240px] cursor-pointer flex-col items-start justify-between gap-6 rounded-xl border border-dashed border-border/50 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/35 bg-primary/12 text-primary">
        <Plus className="h-5 w-5" />
      </span>
      <div className="space-y-2 text-left">
        <p className="text-base font-semibold">Новый лот в коллекции</p>
        <p className="text-sm text-muted-foreground">
          Добавьте товар по ссылке или заполните карточку вручную.
        </p>
      </div>
    </Card>
  );
}
