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
import { ListFilter } from "@/components/ListFilter";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { UserWithStats, ListWithMeta } from "@/types";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { useI18n } from "@/components/i18n/language-provider";
import type { ProductCategoryOption } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface FiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | undefined;
  usersWithStats: UserWithStats[];
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
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
  { value: "priority-high", label: "Приоритет ↓" },
  { value: "priority-low", label: "Приоритет ↑" },
  { value: "price-high", label: "Ориент. цена ↓" },
  { value: "price-low", label: "Ориент. цена ↑" },
] as const;

export function FiltersDrawer({
  open,
  onOpenChange,
  currentUserId,
  usersWithStats,
  selectedUserId,
  onUserChange,
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
  const otherUsers = usersWithStats.filter((user) => user.id !== currentUserId);
  const isMyItemsSelected = selectedUserId === "me" || selectedUserId === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="mobile-filter-drawer"
        className="dialog-modal-surface bottom-0 left-0 top-auto max-h-[92dvh] min-h-0 w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-b-none rounded-t-2xl border border-border bg-popover/95 p-0 backdrop-blur-[18px] sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[min(88dvh,48rem)] sm:w-[min(95vw,calc(100vw-1rem))] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
        bodyClassName="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0"
      >
        <div className="shrink-0 px-4 pb-3 pt-2 sm:px-5 sm:pt-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />
          <DialogHeader className="pr-10 text-left">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">{t("Фильтры")}</DialogTitle>
              {activeFilterCount > 0 ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </div>
            <DialogDescription>{t("Настройте список и порядок товаров")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto border-t border-border/55 px-4 py-4 overscroll-contain sm:px-5">
          {currentUserId && usersWithStats.length > 0 ? (
            <section className="space-y-2.5" aria-labelledby="mobile-filter-user">
              <Label
                id="mobile-filter-user"
                className="text-xs font-semibold text-muted-foreground"
              >
                {t("Пользователь")}
              </Label>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterChoice
                  selected={selectedUserId === null}
                  onClick={() => onUserChange(null)}
                  label={t("Все пользователи")}
                  testId="mobile-user-option-all"
                />
                <FilterChoice
                  selected={isMyItemsSelected}
                  onClick={() => onUserChange("me")}
                  label={t("Мои")}
                  testId="mobile-user-option-me"
                />
                {otherUsers.map((user) => (
                  <FilterChoice
                    key={user.id}
                    selected={selectedUserId === user.id}
                    onClick={() => onUserChange(user.id)}
                    label={user.name}
                    testId={`mobile-user-option-${user.id}`}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {currentUserId ? (
            <section className="space-y-2.5" aria-labelledby="mobile-filter-list">
              <Label
                id="mobile-filter-list"
                className="text-xs font-semibold text-muted-foreground"
              >
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
            <Label
              id="mobile-filter-purchased"
              className="text-xs font-semibold text-muted-foreground"
            >
              {t("Купленные")}
            </Label>
            <button
              type="button"
              className={cn(
                "flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showPurchased
                  ? "border-primary/45 bg-primary/12 text-foreground"
                  : "border-border/65 bg-[hsl(var(--surface-2)/0.46)] text-muted-foreground",
              )}
              aria-pressed={showPurchased}
              onClick={onTogglePurchased}
              data-testid="mobile-purchased-toggle"
            >
              {showPurchased ? (
                <Eye className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <EyeOff className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1">
                {showPurchased ? t("Показаны купленные") : t("Скрыты купленные")}
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  showPurchased ? "bg-primary" : "bg-muted",
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
                    className="min-h-9 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    prefix={category.icon}
                    testId={`mobile-category-${category.id}`}
                    fill
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border/65 bg-popover/96 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-5">
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
  prefix?: string;
  testId: string;
  fill?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        fill ? "w-full min-w-0" : "shrink-0",
        selected
          ? "border-primary/50 bg-primary/13 pr-8 text-foreground"
          : "border-border/65 bg-[hsl(var(--surface-2)/0.46)] text-muted-foreground hover:bg-accent/65 hover:text-foreground",
      )}
      aria-pressed={selected}
      onClick={onClick}
      data-testid={testId}
    >
      {prefix ? <span className="text-base text-primary/80">{prefix}</span> : null}
      <span className="min-w-0 truncate">{label}</span>
      {selected ? <Check className="absolute right-2.5 h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  );
}
