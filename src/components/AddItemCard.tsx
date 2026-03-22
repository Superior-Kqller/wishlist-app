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
          ? "flex min-h-[220px] cursor-not-allowed flex-col items-center justify-center gap-3 border-dashed bg-card/50 text-center opacity-60"
          : "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 border-dashed bg-card text-center transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      }
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-background">
        <Plus className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">Добавить товар</p>
        <p className="text-xs text-muted-foreground">По ссылке или вручную</p>
      </div>
    </Card>
  );
}
