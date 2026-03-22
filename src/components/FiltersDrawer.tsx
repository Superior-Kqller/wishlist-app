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
      <DialogContent className="dialog-modal-surface min-h-0 w-[min(95vw,calc(100vw-1rem))] max-w-md gap-0 border border-border/80 bg-card/90 backdrop-blur-[20px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Фильтры</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pb-2">
          {currentUserId && usersWithStats.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Пользователь</Label>
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
              <Label className="text-xs text-muted-foreground">Подборка</Label>
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
            <Label className="text-xs text-muted-foreground">Сортировка</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="h-10 w-full">
                <SlidersHorizontal className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue placeholder="Сортировка" />
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
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Купленные</Label>
            <Button
              variant={showPurchased ? "glassActive" : "glass"}
              className="h-10 w-full justify-start"
              onClick={onTogglePurchased}
            >
              {showPurchased ? (
                <Eye className="w-4 h-4 mr-2" />
              ) : (
                <EyeOff className="w-4 h-4 mr-2" />
              )}
              {showPurchased ? "Показаны купленные" : "Скрыты купленные"}
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Теги</Label>
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
            Готово
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
