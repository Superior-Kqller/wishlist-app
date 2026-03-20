"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import { UserWithStats } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveUserScope } from "@/lib/filter-state";

interface UserFilterProps {
  selectedUserId: string | null; // null = все, "me" = мои, userId = конкретный
  onUserChange: (userId: string | null) => void;
  users: UserWithStats[];
  currentUserId: string;
}

export function UserFilter({
  selectedUserId,
  onUserChange,
  users,
  currentUserId,
}: UserFilterProps) {
  const currentUser = users.find((u) => u.id === currentUserId);
  const otherUsers = users.filter((u) => u.id !== currentUserId);
  const userScope = resolveUserScope(selectedUserId, currentUserId);
  const isMyMode = userScope === "me";

  const selectedUser = selectedUserId && selectedUserId !== "me" && selectedUserId !== currentUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Выбрать пользователя"
            className={cn(
              "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "touch-manipulation",
              (selectedUser || isMyMode) && "bg-accent"
            )}
            data-testid="mobile-user-trigger"
          >
            {selectedUser ? (
              <>
                <UserAvatar
                  avatarUrl={selectedUser.avatarUrl}
                  name={selectedUser.name}
                  userId={selectedUser.id}
                  size="sm"
                />
                <span className="max-w-[120px] truncate">{selectedUser.name}</span>
              </>
            ) : isMyMode ? (
              <>
                {currentUser && (
                  <UserAvatar
                    avatarUrl={currentUser.avatarUrl}
                    name={currentUser.name}
                    userId={currentUser.id}
                    size="sm"
                  />
                )}
                <span>Я</span>
              </>
            ) : (
              <span>Все пользователи</span>
            )}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          collisionPadding={12}
          className="w-[min(16rem,calc(100vw-2rem))] max-h-[min(70vh,24rem)] overflow-y-auto"
        >
          <DropdownMenuItem
            onClick={() => onUserChange(null)}
            className={cn("cursor-pointer", selectedUserId === null && "bg-accent")}
            data-testid="mobile-user-option-all"
          >
            Все пользователи
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onUserChange("me")}
            className={cn("cursor-pointer", isMyMode && "bg-accent")}
            data-testid="mobile-user-option-me"
          >
            Я
          </DropdownMenuItem>
          {otherUsers.length > 0 && <div className="my-1 h-px bg-border" />}
          {otherUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => onUserChange(user.id)}
              className={cn("flex items-center gap-3 p-3 cursor-pointer", selectedUserId === user.id && "bg-accent")}
              data-testid={`mobile-user-option-${user.id}`}
            >
              <UserAvatar
                avatarUrl={user.avatarUrl}
                name={user.name}
                userId={user.id}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.stats.unpurchasedItems} товаров •{" "}
                  {formatPrice(user.stats.totalWishlistValue, user.stats.currency || "RUB")}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
