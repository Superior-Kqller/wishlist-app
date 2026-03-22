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
          ? "flex min-h-[220px] cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/45 bg-card/25 text-center opacity-60 backdrop-blur-md"
          : "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/30 text-center shadow-[0_8px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-[box-shadow,background-color,border-color] hover:border-primary/35 hover:bg-card/42 hover:shadow-[0_12px_36px_rgba(88,28,135,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
