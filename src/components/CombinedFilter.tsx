"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { ListPlus, Pencil, ChevronDown, User, FolderOpen } from "lucide-react";
import { UserWithStats, ListWithMeta } from "@/types";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { resolveUserScope } from "@/lib/filter-state";

interface CombinedFilterProps {
  currentUserId: string;
  users: UserWithStats[];
  lists: ListWithMeta[];
  selectedUserId: string | null;
  selectedListId: string | null;
  onUserChange: (userId: string | null) => void;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditList?: () => void;
}

export function CombinedFilter({
  currentUserId,
  users,
  lists,
  selectedUserId,
  selectedListId,
  onUserChange,
  onListChange,
  onCreateList,
  onEditList,
}: CombinedFilterProps) {
  const currentUser = users.find((u) => u.id === currentUserId);
  const otherUsers = users.filter((u) => u.id !== currentUserId);

  const userScope = resolveUserScope(selectedUserId, currentUserId);
  const isMyMode = userScope === "me";
  const selectedOtherUser =
    userScope === "user" ? users.find((u) => u.id === selectedUserId) : null;

  const selectedUserLists = useMemo(
    () =>
      filterListsBySelectedUser(lists, users, currentUserId, selectedUserId),
    [lists, users, currentUserId, selectedUserId]
  );

  const handleSelectUser = (userId: string | null) => {
    onUserChange(userId);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="glass"
            className="h-9 gap-2 px-3 touch-manipulation"
            aria-label="Выбрать пользователя"
            data-testid="combined-user-trigger"
          >
            {selectedOtherUser ? (
              <>
                <div className="pointer-events-none">
                  <UserAvatar
                    avatarUrl={selectedOtherUser.avatarUrl}
                    name={selectedOtherUser.name}
                    userId={selectedOtherUser.id}
                    size="sm"
                  />
                </div>
                <span className="max-w-[100px] truncate">{selectedOtherUser.name}</span>
              </>
            ) : isMyMode ? (
              <>
                {currentUser && (
                  <div className="pointer-events-none">
                    <UserAvatar
                      avatarUrl={currentUser.avatarUrl}
                      name={currentUser.name}
                      userId={currentUser.id}
                      size="sm"
                    />
                  </div>
                )}
                <span>Мои</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 opacity-60" />
                <span>Все пользователи</span>
              </>
            )}
            <ChevronDown className="w-4 h-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 rounded-xl border border-border/80 bg-popover/95 p-1.5 backdrop-blur-[14px]"
        >
          <DropdownMenuLabel className="px-2 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Пользователь
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border/80" />
          <DropdownMenuItem
            onClick={() => handleSelectUser(null)}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-2 text-sm",
              selectedUserId === null
                ? "border border-primary/45 bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="combined-user-option-all"
          >
            Все пользователи
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelectUser("me")}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-2 text-sm",
              isMyMode
                ? "border border-primary/45 bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="combined-user-option-me"
          >
            Мои
          </DropdownMenuItem>
          {otherUsers.length > 0 && <DropdownMenuSeparator className="my-1 bg-border/80" />}
          {otherUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md p-2",
                selectedUserId === user.id
                  ? "border border-primary/45 bg-primary/20 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`combined-user-option-${user.id}`}
            >
              <div className="pointer-events-none">
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                  userId={user.id}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.stats.unpurchasedItems} желаний
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <Select
          value={selectedListId ?? "all"}
          onValueChange={(v) => onListChange(v === "all" ? null : v)}
        >
          <SelectTrigger
            className={cn("h-9 w-[min(180px,100%)] sm:w-[180px]", filterBarTriggerClass)}
          >
            <FolderOpen className="w-4 h-4 mr-2 opacity-60" />
            <SelectValue placeholder="Подборка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все подборки</SelectItem>
            {selectedUserLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name} ({list._count.items})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onEditList && selectedListId && (
          <Button
            type="button"
            variant="glass"
            size="iconToolbar"
            onClick={onEditList}
            title="Изменить подборку"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}

        {isMyMode && (
          <Button
            type="button"
            variant="glass"
            size="sm"
            onClick={onCreateList}
            className="h-9 gap-1.5"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        )}
      </div>
    </div>
  );
}
