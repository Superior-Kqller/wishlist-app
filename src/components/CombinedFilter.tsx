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
    onListChange(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={selectedOtherUser || isMyMode ? "default" : "outline"}
            className="min-h-[44px] gap-2 touch-manipulation"
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
                <span>Я</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>Все пользователи</span>
              </>
            )}
            <ChevronDown className="w-4 h-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Пользователь</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => handleSelectUser(null)}
            className={cn("cursor-pointer", selectedUserId === null && "bg-accent")}
            data-testid="combined-user-option-all"
          >
            Все пользователи
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => handleSelectUser("me")}
            className={cn("cursor-pointer", isMyMode && "bg-accent")}
            data-testid="combined-user-option-me"
          >
            Я
          </DropdownMenuItem>
          {otherUsers.length > 0 && <DropdownMenuSeparator />}
          {otherUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onSelect={() => handleSelectUser(user.id)}
              className={cn(
                "flex items-center gap-3 p-2 cursor-pointer",
                selectedUserId === user.id && "bg-accent"
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
          <SelectTrigger className="min-h-[44px] w-[180px]">
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
            variant="outline"
            size="icon"
            onClick={onEditList}
            className="h-11 w-11"
            title="Изменить подборку"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}

        {isMyMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateList}
            className="min-h-[44px]"
          >
            <ListPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        )}
      </div>
    </div>
  );
}
