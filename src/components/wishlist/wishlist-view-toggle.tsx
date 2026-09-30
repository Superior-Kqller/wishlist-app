"use client";

import { Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uiLayout } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";
import { SegmentGlide } from "@/components/ui/segment-glide";

export type WishlistViewMode = "grid" | "table";

type WishlistViewToggleProps = {
  value: WishlistViewMode;
  onValueChange: (value: WishlistViewMode) => void;
  className?: string;
};

const OPTIONS = [
  { mode: "grid", icon: Grid2X2, label: "Показать карточками" },
  { mode: "table", icon: List, label: "Показать таблицей" },
] as const;

/** Сегмент-пилюля: выбранный вид — чернилами (DESIGN.md → «Чипы / фильтры»). */
export function WishlistViewToggle({ value, onValueChange, className }: WishlistViewToggleProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "relative isolate inline-flex items-center gap-0.5 p-0.5",
        uiLayout.filterBarTrigger,
        className,
      )}
      aria-label={t("Режим отображения")}
    >
      <SegmentGlide />
      {OPTIONS.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          type="button"
          variant={value === mode ? "segmentActive" : "ghost"}
          className="h-8 min-h-8 w-8 rounded-full border-0 p-0 sm:min-h-8"
          aria-label={t(label)}
          aria-pressed={value === mode}
          onClick={() => onValueChange(mode)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
