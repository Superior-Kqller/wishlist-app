"use client";

import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Eye, EyeOff, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { uiState } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

export { filterBarTriggerClass };

interface WishlistSearchInputProps {
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function WishlistSearchInput({
  search,
  onSearchChange,
  className,
}: WishlistSearchInputProps) {
  const { t } = useI18n();

  return (
    <SearchField
      value={search}
      onValueChange={onSearchChange}
      placeholder={t("Поиск…")}
      aria-label={t("Поиск")}
      wrapperClassName={cn("group", className)}
      iconClassName="left-3.5 text-muted-foreground/62 transition-colors duration-200 group-focus-within:text-primary/88"
      inputClassName={cn(
        filterBarTriggerClass,
        // Поиск равняется по общей высоте ряда и больше не несёт собственной
        // тени: он вторичный контрол, а выглядел самым тяжёлым объектом экрана.
        "rounded-lg border-border/52 bg-[hsl(var(--surface-3)/0.72)] pl-10 pr-3 text-sm placeholder:text-muted-foreground-subtle hover:border-primary/28 hover:bg-[hsl(var(--surface-3)/0.88)] focus-visible:border-primary/48 focus-visible:ring-2 focus-visible:ring-primary/18 focus-visible:ring-offset-0",
      )}
    />
  );
}

interface WishlistToolbarControlsProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchased: () => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
  showSelectionButton?: boolean;
  className?: string;
}

export function WishlistToolbarControls({
  sortBy,
  onSortChange,
  showPurchased,
  onTogglePurchased,
  selectionMode,
  onToggleSelection,
  showSelectionButton = true,
  className,
}: WishlistToolbarControlsProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex flex-shrink-0 items-center gap-2", className)}>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger
          className={cn("w-9 shrink-0 px-0 sm:w-[184px] sm:px-3", filterBarTriggerClass)}
          title={t("Сортировка")}
          aria-label={t("Сортировка")}
        >
          <SlidersHorizontal className="mx-auto h-4 w-4 shrink-0 text-muted-foreground/85 sm:mx-0 sm:mr-2" />
          <SelectValue placeholder={t("Сортировка")} className="sr-only sm:not-sr-only sm:inline" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">{t("Новые сначала")}</SelectItem>
          <SelectItem value="oldest">{t("Старые сначала")}</SelectItem>
          <SelectItem value="priority-high">{t("Приоритет ↓")}</SelectItem>
          <SelectItem value="priority-low">{t("Приоритет ↑")}</SelectItem>
          <SelectItem value="price-high">{t("Ориент. цена ↓")}</SelectItem>
          <SelectItem value="price-low">{t("Ориент. цена ↑")}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="secondary"
        size="iconToolbar"
        onClick={onTogglePurchased}
        title={showPurchased ? t("Скрыть купленные") : t("Показать купленные")}
        aria-label={showPurchased ? t("Скрыть купленные") : t("Показать купленные")}
      >
        {showPurchased ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      {showSelectionButton ? (
        <Button
          type="button"
          variant={selectionMode ? "secondary" : "outline"}
          size="sm"
          className={selectionMode ? uiState.selectionActive : uiState.selectionIdle}
          title={selectionMode ? t("Отменить выбор") : t("Режим выбора")}
          onClick={onToggleSelection}
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          <span className="hidden min-[1100px]:inline">
            {selectionMode ? t("Отменить выбор") : t("Выбрать")}
          </span>
        </Button>
      ) : null}
    </div>
  );
}
