"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Check, CheckCircle2, ExternalLink, Globe2, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
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
import { cn, formatPrice } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryIcon, getProductCategoryLabel } from "@/lib/categories";

export interface WishCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "PURCHASED") => void;
  statusPending?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
}

const cardMetaChipClass =
  "inline-flex h-5 max-w-full items-center rounded-full border bg-[hsl(var(--surface-2))/0.72] px-1.5 py-0 text-[10px] font-medium leading-none shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-sm";

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
  const showFooter = selectionMode || Boolean(item.price != null || item.url || canManage);

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

  const categoryLabel = getProductCategoryLabel(item.category, language);
  const categoryIcon = getProductCategoryIcon(item.category);

  return (
      <Card
        data-testid="wishlist-card-v2"
        className={cn(
          "group/card flex h-full flex-col overflow-hidden rounded-2xl border-border/50 bg-[hsl(var(--surface-2))/0.88] shadow-[0_16px_40px_rgba(0,0,0,0.24),inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-md max-sm:rounded-xl",
          isBought && "opacity-85 saturate-[0.82]",
          isCardInteractive &&
            "cursor-pointer transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-primary/34 hover:shadow-[0_22px_52px_rgba(0,0,0,0.28),0_0_0_1px_hsl(var(--primary)/0.12)] focus-visible:border-primary/45",
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
          className={cn(
            "group relative m-1.5 mb-0 aspect-[16/11] shrink-0 overflow-hidden rounded-xl border border-border/34 bg-[radial-gradient(circle_at_50%_32%,hsl(var(--surface-3))_0%,hsl(var(--surface-1))_62%,hsl(var(--background))_100%)] after:pointer-events-none after:absolute after:inset-0 after:z-[1] after:bg-[linear-gradient(180deg,hsl(var(--background)/0.02)_0%,transparent_56%,hsl(var(--background)/0.2)_100%)] after:content-[''] sm:m-2 sm:mb-0 sm:aspect-[4/3]",
          )}
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
              className="object-contain p-2 transition-transform duration-500 ease-out group-hover/card:scale-[1.045] sm:p-3"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--surface-3))_0%,hsl(var(--surface-1))_100%)]">
              <Globe2 className="h-10 w-10 text-muted-foreground/55 sm:h-11 sm:w-11" aria-hidden />
            </div>
          )}
        </div>

        <CardHeader className="space-y-2 border-0 bg-transparent p-2.5 sm:p-3">
          <div className="space-y-1.5">
            <CardTitle
              data-testid="wishlist-card-v2-title"
              className={cn(
                "line-clamp-2 min-h-[2.32em] text-[15px] font-semibold leading-[1.16] text-balance text-foreground sm:text-base",
                isBought && "line-through"
              )}
            >
              {item.title}
            </CardTitle>
            {item.category ? (
              <div className="flex min-h-5 min-w-0 items-center gap-1 overflow-hidden">
                <span
                  data-testid="wishlist-card-v2-category"
                  className={cn(cardMetaChipClass, "max-w-full truncate border-primary/28 text-foreground/82")}
                >
                  <span aria-hidden className="mr-1">{categoryIcon}</span>
                  {categoryLabel}
                </span>
              </div>
            ) : null}
          </div>

          {isBought ? (
            <div
              data-testid="wishlist-card-v2-purchased-label"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-success/45 bg-success/10 px-2 py-1 text-[11px] font-semibold text-success"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {t("Уже куплено")}
            </div>
          ) : null}

          {ownerName ? (
            <div
              data-testid="wishlist-card-v2-meta"
              className="flex items-center gap-1.5"
            >
              <div
                data-testid="wishlist-card-v2-owner"
                className="flex min-w-0 max-w-full shrink items-center gap-1 text-muted-foreground/82 sm:gap-1.5"
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
            </div>
          ) : null}
        </CardHeader>

        {showFooter ? (
          <CardFooter
            data-testid="wishlist-card-v2-footer"
            className="mt-auto flex flex-row items-center gap-2 border-t border-border/18 bg-[hsl(var(--surface-1))/0.24] p-2 sm:p-2.5"
          >
          {selectionMode ? (
            <p className="text-xs text-muted-foreground">
              {t("Нажмите на карточку, чтобы")} {isSelected ? t("снять выбор") : t("выбрать")}.
            </p>
          ) : null}
          {item.url || canManage ? (
            <TooltipProvider delayDuration={450} skipDelayDuration={200}>
              <div className="flex w-full flex-row items-center justify-between gap-2">
                {item.price != null ? (
                  <p
                    data-testid="wishlist-card-v2-price"
                    className="min-w-0 truncate text-[15px] font-bold leading-none tabular-nums text-foreground sm:text-base"
                  >
                    {formatPrice(item.price, item.currency, language)}
                  </p>
                ) : (
                  <span className="min-w-0 flex-1" aria-hidden />
                )}
                <div className="flex shrink-0 flex-row items-center gap-1.5">
                {item.url ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        asChild
                        className="h-11 min-h-[44px] min-w-0 flex-1 justify-center gap-2 rounded-r-none border-primary/24 bg-primary/9 px-3 text-sm font-semibold shadow-none hover:border-primary/40 hover:bg-primary/15 sm:h-10 sm:min-h-10 sm:flex-none sm:px-4"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("Открыть ссылку на товар в новой вкладке")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
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
                        className={cn(
                          "size-11 min-w-[44px] shrink-0 sm:size-10 sm:min-w-10",
                          item.url && "-ml-px rounded-l-none",
                        )}
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
              </div>
            </TooltipProvider>
          ) : item.price != null ? (
            <p
              data-testid="wishlist-card-v2-price"
              className="min-w-0 truncate text-[15px] font-bold leading-none tabular-nums text-foreground sm:text-base"
            >
              {formatPrice(item.price, item.currency, language)}
            </p>
          ) : null}
          </CardFooter>
        ) : null}
      </Card>
  );
});
