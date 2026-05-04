"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Check, Globe2, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/wishlist/status-badge";

export interface WishCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => void;
  statusPending?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
}

export const WishCard = memo(function WishCard({
  item,
  onEdit,
  onDelete,
  onTogglePurchased,
  onSetStatus,
  statusPending = false,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
  currentUserId,
  currentUserRole,
}: WishCardProps) {
  const [imageError, setImageError] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const isBought = item.purchased || item.status === "PURCHASED";

  const canManage =
    currentUserId === item.userId || currentUserRole === "ADMIN";

  const ownerName = item.user?.name;
  const ownerId = item.user?.id ?? item.userId;
  const ownerImage = item.user?.avatarUrl ?? null;

  const isCardInteractive = Boolean(onOpenDetail || selectionMode);

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  const handleCardKeyDown = (e: KeyboardEvent) => {
    if (!isCardInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleMarkPurchased = () => {
    if (onSetStatus) {
      onSetStatus(item.id, item.status === "PURCHASED" ? "AVAILABLE" : "PURCHASED");
    } else {
      onTogglePurchased(item.id, !item.purchased);
    }
  };

  const showImage = Boolean(imageUrl && !imageError);

  return (
    <div>
      <Card
        data-testid="wishlist-card-v2"
        className={cn(
          "group/card overflow-hidden border-border/80 bg-[linear-gradient(180deg,hsl(var(--surface-3)),hsl(var(--surface-2)))] shadow-[0_14px_34px_rgba(0,0,0,0.28),inset_0_1px_0_hsl(var(--foreground)/0.035)]",
          isBought && "opacity-45 grayscale",
          isCardInteractive &&
            "cursor-pointer transition-[border-color,box-shadow,transform] hover:border-primary/45 hover:shadow-[0_18px_46px_rgba(0,0,0,0.42),0_0_28px_hsl(var(--primary)/0.16),inset_0_1px_0_hsl(var(--foreground)/0.05)] focus-visible:border-primary/45 focus-visible:shadow-[0_18px_46px_rgba(0,0,0,0.42),0_0_28px_hsl(var(--primary)/0.16),inset_0_1px_0_hsl(var(--foreground)/0.05)]",
          isSelected && "ring-2 ring-primary/45"
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        <div
          data-testid="wishlist-card-v2-media"
          className="group relative aspect-[4/3] overflow-hidden bg-[hsl(var(--surface-1))] sm:aspect-[4/5]"
        >
          <PriorityBadgeOverlay priority={item.priority} />
          {selectionMode ? (
            <div
              className={cn(
                "absolute right-2 top-2 z-20 rounded-full border px-2 py-1 text-[11px] font-semibold backdrop-blur-sm",
                isSelected
                  ? "border-primary/60 bg-primary/22 text-foreground"
                  : "border-border bg-card/90 text-muted-foreground"
              )}
            >
              {isSelected ? "Выбрано" : "Выбрать"}
            </div>
          ) : (
            <StatusBadge
              status={item.status}
              className={cn(
                "pointer-events-none absolute bottom-2 right-2 z-10 max-w-[72%] truncate border px-2 py-1 text-[11px] font-medium backdrop-blur-sm sm:bottom-2.5 sm:right-2.5",
                "bg-[hsl(var(--surface-2))/0.82] shadow-[0_8px_18px_rgba(0,0,0,0.28)]",
              )}
            />
          )}
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.045]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Globe2 className="h-14 w-14 text-muted-foreground/65" aria-hidden />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-[hsl(var(--overlay-image-scrim))] via-[hsl(var(--background)/0.34)] to-transparent"
            aria-hidden
          />
        </div>

        <CardHeader className="border-t border-border/45 p-3 pb-2">
          <CardTitle
            data-testid="wishlist-card-v2-title"
            className={cn(
              "line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]",
              isBought && "line-through"
            )}
          >
            {item.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 p-3 pt-0">
          {(ownerName || item.price != null) && (
            <div className="flex items-center justify-between gap-2">
              {ownerName ? (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    {ownerImage && !ownerImageError ? (
                      <Image
                        src={ownerImage}
                        alt={ownerName}
                        fill
                        className="object-cover"
                        sizes="28px"
                        unoptimized={ownerImage.startsWith("/uploads/")}
                        onError={() => setOwnerImageError(true)}
                      />
                    ) : (
                      <AvatarFallback
                        className={cn(
                          "text-[10px] font-semibold text-primary-foreground",
                          getAvatarColor(ownerId)
                        )}
                      >
                        {getInitials(ownerName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">{ownerName}</span>
                </div>
              ) : (
                <span className="min-w-0 shrink" aria-hidden />
              )}
              {item.price != null ? (
                <p
                  data-testid="wishlist-card-v2-price"
                  className="shrink-0 text-right text-[15px] font-semibold tabular-nums tracking-tight text-foreground"
                >
                  {formatPrice(item.price, item.currency)}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>

        <CardFooter
          data-testid="wishlist-card-v2-footer"
          className="flex flex-col gap-2 p-3 pt-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2"
        >
          {selectionMode ? (
            <p className="text-xs text-muted-foreground">
              Нажмите на карточку, чтобы {isSelected ? "снять выбор" : "выбрать"}.
            </p>
          ) : null}
          {item.url || canManage ? (
            <TooltipProvider delayDuration={450} skipDelayDuration={200}>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                {item.url ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        asChild
                        className="h-11 min-h-[44px] w-full justify-center rounded-lg border-primary/35 bg-primary/10 px-4 text-sm font-semibold shadow-none hover:border-primary/55 hover:bg-primary/16 sm:h-9 sm:min-h-9 sm:w-auto sm:min-w-[8rem]"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Открыть ссылку на товар в новой вкладке"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Открыть
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Открыть в новой вкладке</TooltipContent>
                  </Tooltip>
                ) : null}

                {canManage && !selectionMode ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        type="button"
                        data-testid="wishlist-card-actions"
                        intent="default"
                        aria-label="Действия с карточкой"
                        className="w-full min-w-0 sm:w-11"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkPurchased();
                        }}
                        disabled={statusPending}
                      >
                        {isBought ? (
                          <Undo2 className="mr-2 h-4 w-4" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {isBought ? "Вернуть в доступные" : "Отметить купленным"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        disabled={statusPending}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </TooltipProvider>
          ) : null}
        </CardFooter>

      </Card>
    </div>
  );
});
