"use client";

import { Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WishlistViewMode = "grid" | "table";

type WishlistViewToggleProps = {
  value: WishlistViewMode;
  onValueChange: (value: WishlistViewMode) => void;
  className?: string;
};

export function WishlistViewToggle({
  value,
  onValueChange,
  className,
}: WishlistViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-card p-0.5",
        className,
      )}
      aria-label="Режим отображения"
    >
      <Button
        type="button"
        variant={value === "grid" ? "glassActive" : "ghost"}
        size="iconToolbar"
        aria-label="Показать карточками"
        aria-pressed={value === "grid"}
        onClick={() => onValueChange("grid")}
      >
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={value === "table" ? "glassActive" : "ghost"}
        size="iconToolbar"
        aria-label="Показать таблицей"
        aria-pressed={value === "table"}
        onClick={() => onValueChange("table")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
