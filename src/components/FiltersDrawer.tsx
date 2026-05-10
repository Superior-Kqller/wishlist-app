"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserFilter } from "@/components/UserFilter";
import { ListFilter } from "@/components/ListFilter";
import { TagFilter } from "@/components/TagFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Eye, EyeOff } from "lucide-react";
import type { UserWithStats, ListWithMeta, Tag } from "@/types";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { useI18n } from "@/components/i18n/language-provider";

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
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearTags: () => void;
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
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
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
      <DialogContent className="dialog-modal-surface min-h-0 w-[min(95vw,calc(100vw-1rem))] max-w-md gap-0 border border-border bg-popover/88 backdrop-blur-[18px] max-sm:bottom-0 max-sm:left-0 max-sm:top-auto max-sm:max-h-[85dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("Фильтры")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {currentUserId && usersWithStats.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("Пользователь")}</Label>
              <UserFilter
                selectedUserId={selectedUserId}
                onUserChange={onUserChange}
                users={usersWithStats}
                currentUserId={currentUserId}
              />
            </div>
          )}
          {currentUserId && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("Подборка")}</Label>
              <ListFilter
                selectedListId={selectedListId}
                onListChange={onListChange}
                lists={listsForPicker}
                onCreateClick={onCreateList}
                onEditClick={onEditList}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("Сортировка")}</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-10 w-full">
                <SlidersHorizontal className="w-4 h-4 mr-2 shrink-0" />
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
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("Купленные")}</Label>
            <Button
              variant="secondary"
              className="h-10 w-full justify-start"
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
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t("Теги")}</Label>
              <TagFilter
                tags={tags}
                selectedTags={selectedTags}
                onToggleTag={onToggleTag}
                onClearTags={onClearTags}
              />
            </div>
          )}
          <Button
            className="mt-2 h-10 w-full"
            onClick={() => onOpenChange(false)}
          >
            {t("Готово")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
