"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ListFilter } from "@/components/ListFilter";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { UserWithStats, ListWithMeta } from "@/types";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { useI18n } from "@/components/i18n/language-provider";
import type { ProductCategoryOption } from "@/lib/categories";
import { ProductCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

interface FiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | undefined;
  usersWithStats: UserWithStats[];
  selectedUserId: string | null;
  lists: ListWithMeta[];
  selectedListId: string | null;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditList: (() => void) | undefined;
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchased: () => void;
  categories: ProductCategoryOption[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  activeFilterCount: number;
  resultCount: number;
  onClearAllFilters: () => void;
}

const sortOptions = [
  { value: "newest", label: "Новые сначала" },
  { value: "oldest", label: "Старые сначала" },
  { value: "priority-high", label: "Сначала важные" },
  { value: "priority-low", label: "Сначала неважные" },
  { value: "price-high", label: "Сначала дороже" },
  { value: "price-low", label: "Сначала дешевле" },
] as const;

export function FiltersDrawer({
  open,
  onOpenChange,
  currentUserId,
  usersWithStats,
  selectedUserId,
  lists,
  selectedListId,
  onListChange,
  onCreateList,
  onEditList,
  sortBy,
  onSortChange,
  showPurchased,
  onTogglePurchased,
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  activeFilterCount,
  resultCount,
  onClearAllFilters,
}: FiltersDrawerProps) {
  const { language, t } = useI18n();
  const listsForPicker = useMemo(() => {
    if (!currentUserId) return lists;
    return filterListsBySelectedUser(lists, usersWithStats, currentUserId, selectedUserId);
  }, [lists, usersWithStats, currentUserId, selectedUserId]);

  const isPhone = useMediaQuery("(max-width: 639px)");

  const countBadge =
    activeFilterCount > 0 ? (
      <span
        key={activeFilterCount}
        className="count-pop flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background"
      >
        {activeFilterCount}
      </span>
    ) : null;

  const body = (
    <div className="space-y-5 px-4 py-4 sm:px-5">
      {/* Людей здесь нет: они стоят рядом лиц над списком на любой ширине,
              и второй выбор того же в панели фильтров только расходился с первым. */}
      {currentUserId ? (
        <section className="space-y-2.5" aria-labelledby="mobile-filter-list">
          <Label id="mobile-filter-list" className="text-xs font-semibold text-muted-foreground">
            {t("Подборка")}
          </Label>
          <div className="[&>div]:!grid [&>div]:w-full [&>div]:grid-cols-[minmax(0,1fr)_auto] [&>div]:gap-2 [&>div>button:last-child]:col-span-2 [&>div>button:last-child]:w-full [&_[role=combobox]]:w-full [&_[role=combobox]]:max-w-none">
            <ListFilter
              selectedListId={selectedListId}
              onListChange={onListChange}
              lists={listsForPicker}
              onCreateClick={onCreateList}
              onEditClick={onEditList}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-2.5" aria-labelledby="mobile-filter-sort">
        <Label id="mobile-filter-sort" className="text-xs font-semibold text-muted-foreground">
          {t("Сортировка")}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {sortOptions.map((option) => (
            <FilterChoice
              key={option.value}
              selected={sortBy === option.value}
              onClick={() => onSortChange(option.value)}
              label={t(option.label)}
              testId={`mobile-sort-${option.value}`}
              fill
            />
          ))}
        </div>
      </section>

      <section className="space-y-2.5" aria-labelledby="mobile-filter-purchased">
        <Label id="mobile-filter-purchased" className="text-xs font-semibold text-muted-foreground">
          {t("Купленные")}
        </Label>
        <button
          type="button"
          className={cn(
            "flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            showPurchased
              ? "border-foreground bg-accent text-foreground"
              : "border-border bg-card text-muted-foreground",
          )}
          aria-pressed={showPurchased}
          onClick={onTogglePurchased}
          data-testid="mobile-purchased-toggle"
        >
          {showPurchased ? (
            <Eye className="h-4 w-4 shrink-0 text-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 shrink-0" />
          )}
          {/*
           * Подпись постоянная, состояние несёт сам тумблер. Пока текст
           * менялся вместе с ним («Скрыты купленные» ⇄ «Показаны
           * купленные»), по подписи нельзя было понять, описывает она
           * нынешнее положение или то, что случится при нажатии.
           */}
          <span className="flex-1">{t("Показывать купленные")}</span>
          <span
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              showPurchased ? "bg-foreground" : "bg-muted",
            )}
            aria-hidden
          >
            <span
              className={cn(
                "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                showPurchased ? "translate-x-6" : "translate-x-1",
              )}
            />
          </span>
        </button>
      </section>

      {categories.length > 0 ? (
        <section className="space-y-2.5" aria-labelledby="mobile-filter-categories">
          <div className="flex items-center justify-between gap-3">
            <Label
              id="mobile-filter-categories"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("Категории")}
              {selectedCategories.length > 0 ? ` · ${selectedCategories.length}` : ""}
            </Label>
            {selectedCategories.length > 0 ? (
              <button
                type="button"
                className="min-h-9 rounded-lg px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onClearCategories}
              >
                {t("Сбросить")}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <FilterChoice
                key={category.id}
                selected={selectedCategories.includes(category.id)}
                onClick={() => onToggleCategory(category.id)}
                label={language === "en" ? category.labelEn : category.label}
                prefix={
                  <ProductCategoryIcon
                    category={category.id}
                    className="size-4 shrink-0 text-foreground"
                  />
                }
                testId={`mobile-category-${category.id}`}
                fill
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  const footer = (
    <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border bg-popover px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5">
      <Button
        type="button"
        variant="ghost"
        className="h-12 gap-2 px-3 text-muted-foreground"
        onClick={onClearAllFilters}
        disabled={activeFilterCount === 0}
      >
        <RotateCcw className="h-4 w-4" />
        {t("Сбросить")}
      </Button>
      <Button
        type="button"
        className="h-12 min-w-0 text-sm font-semibold"
        onClick={() => onOpenChange(false)}
      >
        <span className="truncate">
          {t("Показать")} · {resultCount}
        </span>
      </Button>
    </div>
  );

  // Телефон — нижний лист со смахиванием (Drawer, 21st.dev → Base UI); шире — диалог.
  if (isPhone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          id="wishlist-filters"
          title={t("Фильтры")}
          titleAdornment={countBadge}
          description={t("Настройте список и порядок желаний")}
          footer={footer}
        >
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="wishlist-filters"
        className="dialog-modal-surface max-h-[min(88dvh,48rem)] w-[min(95vw,calc(100vw-1rem))] gap-0 border border-border bg-popover p-0"
        bodyClassName="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 px-5 pb-3 pr-14 pt-5 text-left">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">{t("Фильтры")}</DialogTitle>
            {countBadge}
          </div>
          <DialogDescription>{t("Настройте список и порядок желаний")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border">
          {body}
        </div>
        {footer}
      </DialogContent>
    </Dialog>
  );
}

function FilterChoice({
  selected,
  onClick,
  label,
  prefix,
  testId,
  fill = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  prefix?: React.ReactNode;
  testId: string;
  fill?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        fill ? "w-full min-w-0" : "shrink-0",
        selected
          ? "border-foreground bg-accent pr-8 text-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent/70 hover:text-foreground",
      )}
      aria-pressed={selected}
      onClick={onClick}
      data-testid={testId}
    >
      {prefix}
      <span className="min-w-0 truncate">{label}</span>
      {selected ? <Check className="absolute right-2.5 h-4 w-4 shrink-0 text-foreground" /> : null}
    </button>
  );
}
