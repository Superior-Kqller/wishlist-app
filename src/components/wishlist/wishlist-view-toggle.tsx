"use client";

import { Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { useI18n } from "@/components/i18n/language-provider";

export type WishlistViewMode = "grid" | "table";

type WishlistViewToggleProps = {
  value: WishlistViewMode;
  onValueChange: (value: WishlistViewMode) => void;
  className?: string;
};

export function WishlistViewToggle({ value, onValueChange, className }: WishlistViewToggleProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn("inline-flex rounded-lg p-0.5", filterBarTriggerClass, className)}
      aria-label={t("Режим отображения")}
    >
      <Button
        type="button"
        variant={value === "grid" ? "segmentActive" : "ghost"}
        size="iconToolbar"
        className={cn(
          "h-9 w-9 rounded-md border-0",
          value === "grid"
            ? "bg-[hsl(var(--surface-4)/0.85)] text-foreground hover:bg-[hsl(var(--surface-4)/0.95)]"
            : "hover:bg-[hsl(var(--surface-4)/0.55)]",
        )}
        aria-label={t("Показать карточками")}
        aria-pressed={value === "grid"}
        onClick={() => onValueChange("grid")}
      >
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={value === "table" ? "segmentActive" : "ghost"}
        size="iconToolbar"
        className={cn(
          "h-9 w-9 rounded-md border-0",
          value === "table"
            ? "bg-[hsl(var(--surface-4)/0.85)] text-foreground hover:bg-[hsl(var(--surface-4)/0.95)]"
            : "hover:bg-[hsl(var(--surface-4)/0.55)]",
        )}
        aria-label={t("Показать таблицей")}
        aria-pressed={value === "table"}
        onClick={() => onValueChange("table")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
