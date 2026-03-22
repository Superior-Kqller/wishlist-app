"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Eye, EyeOff, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";

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
  return (
    <div className={cn("relative min-w-0 w-full", className)}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground/80" />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск..."
        className={cn(
          "h-9 pl-8 text-sm placeholder:text-muted-foreground/85",
          filterBarTriggerClass,
        )}
      />
    </div>
  );
}

interface WishlistToolbarControlsProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchased: () => void;
  selectionMode: boolean;
  onToggleSelection: () => void;
  /** Скрыть кнопку «Выбрать» (для устаревшей обёртки SearchAndFilter) */
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
  return (
    <div className={cn("flex flex-shrink-0 items-center gap-2", className)}>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger
          className={cn(
            "w-9 shrink-0 px-0 sm:w-[168px] sm:px-3",
            filterBarTriggerClass,
          )}
          title="Сортировка"
        >
          <SlidersHorizontal className="mx-auto h-4 w-4 shrink-0 text-muted-foreground/85 sm:mx-0 sm:mr-2" />
          <SelectValue
            placeholder="Сортировка"
            className="sr-only sm:not-sr-only sm:inline"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Новые сначала</SelectItem>
          <SelectItem value="oldest">Старые сначала</SelectItem>
          <SelectItem value="priority-high">Приоритет ↓</SelectItem>
          <SelectItem value="priority-low">Приоритет ↑</SelectItem>
          <SelectItem value="price-high">Цена ↓</SelectItem>
          <SelectItem value="price-low">Цена ↑</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="glass"
        size="iconToolbar"
        onClick={onTogglePurchased}
        title={showPurchased ? "Скрыть купленные" : "Показать купленные"}
      >
        {showPurchased ? (
          <Eye className="h-4 w-4 text-muted-foreground/85" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground/85" />
        )}
      </Button>
      {showSelectionButton ? (
        <Button
          type="button"
          variant={selectionMode ? "glassActive" : "glass"}
          size="sm"
          className="h-9 gap-1.5 px-3"
          title={selectionMode ? "Отменить выбор" : "Режим выбора"}
          onClick={onToggleSelection}
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          <span className="hidden min-[1100px]:inline">
            {selectionMode ? "Отменить" : "Выбрать"}
          </span>
        </Button>
      ) : null}
    </div>
  );
}

/** @deprecated Используйте WishlistSearchInput + WishlistToolbarControls в разметке страницы */
export function SearchAndFilter({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  showPurchased,
  onTogglePurchased,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchased: () => void;
}) {
  return (
    <div className="flex flex-row gap-2 sm:gap-2.5">
      <WishlistSearchInput search={search} onSearchChange={onSearchChange} />
      <WishlistToolbarControls
        sortBy={sortBy}
        onSortChange={onSortChange}
        showPurchased={showPurchased}
        onTogglePurchased={onTogglePurchased}
        selectionMode={false}
        onToggleSelection={() => {}}
        showSelectionButton={false}
      />
    </div>
  );
}
