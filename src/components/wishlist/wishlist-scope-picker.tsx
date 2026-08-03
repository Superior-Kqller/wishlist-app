"use client";

import { ChevronDown, FolderOpen, ListPlus, Pencil, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { useI18n } from "@/components/i18n/language-provider";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { cn } from "@/lib/utils";
import type { ListWithMeta, UserWithStats } from "@/types";
import { useMemo } from "react";

type WishlistScopePickerProps = {
  currentUserId: string;
  users: UserWithStats[];
  lists: ListWithMeta[];
  selectedUserId: string | null;
  selectedListId: string | null;
  onUserChange: (userId: string | null) => void;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditList?: () => void;
  className?: string;
};

/**
 * Один контрол на вопрос «чей список я смотрю».
 *
 * Раньше это были четыре отдельных элемента в ряд — выбор человека, выбор
 * подборки, «изменить» и «создать». Вместе они занимали больше места, чем
 * поиск, хотя отвечают на один вопрос и меняются раз в сессию. Ответ виден
 * прямо на триггере, всё остальное живёт в меню.
 */
export function WishlistScopePicker({
  currentUserId,
  users,
  lists,
  selectedUserId,
  selectedListId,
  onUserChange,
  onListChange,
  onCreateList,
  onEditList,
  className,
}: WishlistScopePickerProps) {
  const { t } = useI18n();

  const isMyMode = selectedUserId === "me" || selectedUserId === currentUserId;
  const currentUser = users.find((user) => user.id === currentUserId);
  const selectedOtherUser = users.find(
    (user) => user.id === selectedUserId && user.id !== currentUserId,
  );
  const otherUsers = users.filter((user) => user.id !== currentUserId);

  const visibleLists = useMemo(
    () => filterListsBySelectedUser(lists, users, currentUserId, selectedUserId),
    [lists, users, currentUserId, selectedUserId],
  );
  const selectedList = visibleLists.find((list) => list.id === selectedListId);

  const ownerLabel = selectedOtherUser
    ? selectedOtherUser.name
    : isMyMode
      ? t("Мои")
      : t("Все пользователи");
  const listLabel = selectedList ? selectedList.name : t("Все подборки");
  const avatarUser = selectedOtherUser ?? (isMyMode ? currentUser : undefined);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "min-w-0 max-w-[18rem] gap-2 px-2.5 text-foreground",
            filterBarTriggerClass,
            className,
          )}
          aria-label={`${t("Чей список")}: ${ownerLabel}, ${listLabel}`}
          data-testid="wishlist-scope-trigger"
        >
          {avatarUser ? (
            <span className="pointer-events-none shrink-0">
              <UserAvatar
                avatarUrl={avatarUser.avatarUrl}
                name={avatarUser.name}
                userId={avatarUser.id}
                size="sm"
              />
            </span>
          ) : (
            <User className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          )}
          <span className="min-w-0 truncate text-sm font-medium">{ownerLabel}</span>
          <span className="shrink-0 text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="min-w-0 truncate text-sm text-muted-foreground">{listLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("Чей список")}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onUserChange(null)}
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-2 text-sm",
            scopeItemTone(!selectedUserId),
          )}
          data-testid="combined-user-option-all"
        >
          {t("Все пользователи")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onUserChange("me")}
          className={cn("cursor-pointer rounded-md px-2.5 py-2 text-sm", scopeItemTone(isMyMode))}
          data-testid="combined-user-option-me"
        >
          {t("Мои")}
        </DropdownMenuItem>
        {otherUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => onUserChange(user.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-md p-2",
              scopeItemTone(selectedUserId === user.id),
            )}
            data-testid={`combined-user-option-${user.id}`}
          >
            <span className="pointer-events-none shrink-0">
              <UserAvatar avatarUrl={user.avatarUrl} name={user.name} userId={user.id} size="sm" />
            </span>
            <span className="min-w-0 flex-1 truncate">{user.name}</span>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {user.stats.unpurchasedItems}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1.5 bg-border/80" />

        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("Подборка")}
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onListChange(null)}
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-2 text-sm",
            scopeItemTone(!selectedListId),
          )}
        >
          {t("Все подборки")}
        </DropdownMenuItem>
        {visibleLists.map((list) => (
          <DropdownMenuItem
            key={list.id}
            onClick={() => onListChange(list.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm",
              scopeItemTone(selectedListId === list.id),
            )}
          >
            <FolderOpen className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{list.name}</span>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {list._count.items}
            </span>
          </DropdownMenuItem>
        ))}

        {isMyMode || (onEditList && selectedListId) ? (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-border/80" />
            {onEditList && selectedListId ? (
              <DropdownMenuItem
                onClick={onEditList}
                className="cursor-pointer rounded-md px-2.5 py-2 text-sm"
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden />
                {t("Изменить подборку")}
              </DropdownMenuItem>
            ) : null}
            {isMyMode ? (
              <DropdownMenuItem
                onClick={onCreateList}
                className="cursor-pointer rounded-md px-2.5 py-2 text-sm"
              >
                <ListPlus className="mr-2 h-4 w-4" aria-hidden />
                {t("Создать подборку")}
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function scopeItemTone(selected: boolean) {
  return selected
    ? "border border-primary/45 bg-primary/14 text-foreground"
    : "text-muted-foreground focus:text-foreground";
}
