"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Check, Globe2, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn, formatPrice, getTagColor } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/wishlist/status-badge";
import { useI18n } from "@/components/i18n/language-provider";

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

const cardMetaChipClass =
  "inline-flex h-5 max-w-[5.75rem] items-center rounded-full border bg-[hsl(var(--surface-1))/0.64] px-1.5 py-0 text-[10px] font-medium leading-none shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)] backdrop-blur-sm sm:max-w-[6.5rem]";

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
  const { language, t } = useI18n();
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

  const visibleTags = item.tags.slice(0, 1);
  const hiddenTagCount = Math.max(0, item.tags.length - visibleTags.length);

  return (
      <Card
        data-testid="wishlist-card-v2"
        className={cn(
          "group/card flex h-full min-h-[21.5rem] flex-col overflow-hidden border-border/65 bg-[hsl(var(--surface-2))] elevation-interactive-card max-sm:min-h-0 max-sm:rounded-xl",
          isBought && "opacity-45 grayscale",
          isCardInteractive &&
            "cursor-pointer transition-[border-color,box-shadow,transform] hover:border-primary/45 focus-visible:border-primary/45",
          selectionMode && "ring-1 ring-border/80",
          isSelected && "border-primary/65 ring-2 ring-primary/45 elevation-selected-card"
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        <div
          data-testid="wishlist-card-v2-media"
          className="group relative aspect-[16/10] shrink-0 overflow-hidden bg-[hsl(var(--surface-1))] after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:bg-[hsl(var(--background)/0.38)] after:content-[''] sm:aspect-[4/3]"
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
              {isSelected ? t("Выбрано") : t("Выбрать")}
            </div>
          ) : null}
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-150 ease-out group-hover/card:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Globe2 className="h-14 w-14 text-muted-foreground/65" aria-hidden />
            </div>
          )}
        </div>

        <CardHeader className="space-y-2 border-t border-border/30 p-2.5 sm:p-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <CardTitle
              data-testid="wishlist-card-v2-title"
              className={cn(
                "line-clamp-2 min-h-[2.2rem] text-[15px] font-semibold leading-[1.18] text-balance text-foreground sm:min-h-[2.35rem] sm:text-base",
                isBought && "line-through"
              )}
            >
              {item.title}
            </CardTitle>
            {item.price != null ? (
              <p
                data-testid="wishlist-card-v2-price"
                className="max-w-[8.5rem] shrink-0 truncate pt-0.5 text-right text-base font-semibold leading-none tabular-nums text-foreground sm:text-[17px]"
              >
                {formatPrice(item.price, item.currency, language)}
              </p>
            ) : null}
          </div>

          <div
            data-testid="wishlist-card-v2-meta"
            className="flex min-h-6 items-center gap-2"
          >
            {ownerName ? (
              <div
                data-testid="wishlist-card-v2-owner"
                className="flex min-w-[4.5rem] max-w-[45%] shrink-0 items-center gap-1 text-muted-foreground/82 sm:gap-1.5"
              >
                <Avatar className="h-5 w-5 shrink-0">
                  {ownerImage && !ownerImageError ? (
                    <Image
                      src={ownerImage}
                      alt={ownerName}
                      fill
                      className="object-cover"
                      sizes="24px"
                      unoptimized={ownerImage.startsWith("/uploads/")}
                      onError={() => setOwnerImageError(true)}
                    />
                  ) : (
                    <AvatarFallback
                      className={cn(
                        "text-[9px] font-semibold text-primary-foreground",
                        getAvatarColor(ownerId)
                      )}
                    >
                      {getInitials(ownerName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="min-w-0 truncate text-[11px]">{ownerName}</span>
              </div>
            ) : (
              <span className="min-w-0" aria-hidden />
            )}
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1">
              <span data-testid="wishlist-card-v2-status" className="min-w-0">
                <StatusBadge
                  status={item.status}
                  className={cn(
                    cardMetaChipClass,
                    "bg-[hsl(var(--surface-1))/0.64] [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
                    item.status === "CLAIMED" && "border-warning/65 text-warning",
                    item.status === "PURCHASED" && "border-success/65 text-success",
                    item.status === "AVAILABLE" && "border-info/65 text-info"
                  )}
                />
              </span>
              {visibleTags.length > 0 ? (
                <>
                  {visibleTags.map((tag) => {
                    const color =
                      tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
                    return (
                      <span
                        key={tag.id}
                        data-testid="wishlist-card-v2-tag"
                        className={cn(cardMetaChipClass, "max-w-[5.5rem]")}
                        style={{ borderColor: color, color }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                  {hiddenTagCount > 0 ? (
                    <span
                      className={cn(
                        cardMetaChipClass,
                        "max-w-none border-border/45 text-muted-foreground"
                      )}
                    >
                      +{hiddenTagCount}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="sr-only">{t("Без тегов")}</span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardFooter
          data-testid="wishlist-card-v2-footer"
          className="mt-auto flex min-h-[3.1rem] flex-row items-center gap-2 border-t border-border/25 p-2.5 sm:min-h-[3.25rem] sm:p-2.5"
        >
          {selectionMode ? (
            <p className="text-xs text-muted-foreground">
              {t("Нажмите на карточку, чтобы")} {isSelected ? t("снять выбор") : t("выбрать")}.
            </p>
          ) : null}
          {item.url || canManage ? (
            <TooltipProvider delayDuration={450} skipDelayDuration={200}>
              <div className="flex w-full flex-row items-center justify-between gap-2 sm:gap-3">
                {item.url ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        asChild
                        className="h-11 min-h-[44px] min-w-0 flex-1 justify-center rounded-lg border-primary/30 bg-primary/10 px-3 text-sm font-semibold shadow-none hover:border-primary/50 hover:bg-primary/16 sm:h-10 sm:min-h-10 sm:min-w-[8rem] sm:flex-none sm:px-4"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("Открыть ссылку на товар в новой вкладке")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t("Открыть")}
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("Открыть в новой вкладке")}</TooltipContent>
                  </Tooltip>
                ) : null}

                {canManage && !selectionMode ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <IconButton
                        type="button"
                        data-testid="wishlist-card-actions"
                        intent="default"
                        aria-label={t("Действия с карточкой")}
                        className="ml-auto size-11 min-w-[44px] shrink-0 sm:size-10 sm:min-w-10"
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
                        {isBought ? t("Вернуть в доступные") : t("Отметить купленным")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        disabled={statusPending}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("Редактировать")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("Удалить")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </TooltipProvider>
          ) : null}
        </CardFooter>
      </Card>
  );
});
