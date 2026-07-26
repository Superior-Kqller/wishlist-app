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
import { UserFilter } from "@/components/UserFilter";
import { ListFilter } from "@/components/ListFilter";
import { CategoryFilter } from "@/components/CategoryFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import type { UserWithStats, ListWithMeta } from "@/types";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { useI18n } from "@/components/i18n/language-provider";
import type { ProductCategoryOption } from "@/lib/categories";

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
}

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
}: FiltersDrawerProps) {
  const { t } = useI18n();
  const listsForPicker = useMemo(() => {
    if (!currentUserId) return lists;
    return filterListsBySelectedUser(
      lists,
      usersWithStats,
      currentUserId,
      selectedUserId
    );
  }, [lists, usersWithStats, currentUserId, selectedUserId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="mobile-filter-drawer"
        className="dialog-modal-surface min-h-0 w-[min(95vw,calc(100vw-1rem))] max-w-md gap-0 border border-border bg-popover/90 backdrop-blur-[18px] max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-h-[88dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl"
      >
        <div className="-mt-3 mb-1 h-1 w-10 self-center rounded-full bg-border sm:hidden" aria-hidden />
        <DialogHeader className="pb-1">
          <DialogTitle className="text-xl">{t("Фильтры")}</DialogTitle>
          <DialogDescription>
            {t("Настройте список и порядок товаров")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pb-1">
          {currentUserId && usersWithStats.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--surface-2))/0.38] p-3">
              <Label className="text-xs font-semibold text-muted-foreground">{t("Пользователь")}</Label>
              <UserFilter
                selectedUserId={selectedUserId}
                onUserChange={onUserChange}
                users={usersWithStats}
                currentUserId={currentUserId}
              />
            </div>
          )}
          {currentUserId && (
            <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--surface-2))/0.38] p-3">
              <Label className="text-xs font-semibold text-muted-foreground">{t("Подборка")}</Label>
              <ListFilter
                selectedListId={selectedListId}
                onListChange={onListChange}
                lists={listsForPicker}
                onCreateClick={onCreateList}
                onEditClick={onEditList}
              />
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--surface-2))/0.38] p-3">
            <Label className="text-xs font-semibold text-muted-foreground">{t("Сортировка")}</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-11 w-full bg-background/35">
                <SlidersHorizontal className="mr-2 h-4 w-4 shrink-0" />
                <SelectValue placeholder={t("Сортировка")} />
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
          </div>
          <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--surface-2))/0.38] p-3">
            <Label className="text-xs font-semibold text-muted-foreground">{t("Купленные")}</Label>
            <Button
              variant="secondary"
              className="h-11 w-full justify-start bg-background/35"
              onClick={onTogglePurchased}
            >
              {showPurchased ? (
                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4 text-muted-foreground" />
              )}
              {showPurchased ? t("Показаны купленные") : t("Скрыты купленные")}
            </Button>
          </div>
          {categories.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/50 bg-[hsl(var(--surface-2))/0.38] p-3">
              <Label className="text-xs font-semibold text-muted-foreground">{t("Категории")}</Label>
              <CategoryFilter
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={onToggleCategory}
                onClearCategories={onClearCategories}
              />
            </div>
          )}
          <Button
            className="sticky bottom-0 mt-1 h-11 w-full shadow-[0_-8px_24px_hsl(var(--background)/0.45)]"
            onClick={() => onOpenChange(false)}
          >
            {t("Готово")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
