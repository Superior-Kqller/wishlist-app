"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleTabChange = (value: string) => {
    if (value === "all") {
      onUserChange(null);
    } else if (value === "me") {
      onUserChange("me");
    }
  };

  const getCurrentTab = () => {
    if (selectedUserId === null) return "all";
    if (selectedUserId === "me" || selectedUserId === currentUserId) return "me";
    return "other";
  };

  const selectedUser = selectedUserId && selectedUserId !== "me" && selectedUserId !== currentUserId
    ? users.find((u) => u.id === selectedUserId)
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
        <TabsList className="min-h-[44px] overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="min-h-[36px] touch-manipulation">Все</TabsTrigger>
          <TabsTrigger value="me" className="min-h-[36px] touch-manipulation">
            {currentUser && (
              <div className="flex items-center gap-2">
                <UserAvatar
                  avatarUrl={currentUser.avatarUrl}
                  name={currentUser.name}
                  userId={currentUser.id}
                  size="sm"
                />
                <span>Мои желания</span>
              </div>
            )}
            {!currentUser && "Мои желания"}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {otherUsers.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={selectedUser ? `Выбран: ${selectedUser.name}. Открыть список пользователей` : "Открыть список других пользователей"}
              className={cn(
                "flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md text-sm font-medium transition-colors",
                "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "touch-manipulation",
                selectedUser && "bg-accent"
              )}
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
              ) : (
                <>
                  <span>Другие пользователи</span>
                </>
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
            {otherUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => onUserChange(user.id)}
                className="flex items-center gap-3 p-3 cursor-pointer"
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
      )}
    </div>
  );
}
