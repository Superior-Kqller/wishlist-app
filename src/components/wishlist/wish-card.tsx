"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Globe2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { IconButton } from "./icon-button";
import { getItemStatusLabel, getItemStatusMarker, getItemStatusTone } from "@/lib/item-status-presentation";

export interface WishCardProps {
  item: WishlistItem;
  index?: number;
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
  index = 0,
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

  const isCardInteractive = Boolean((onOpenDetail || selectionMode) && !isBought);

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
  const statusTone = getItemStatusTone(item.status);
  const statusMarker = getItemStatusMarker(item.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.04 }}
      whileHover={!isBought ? { y: -4, scale: 1.01 } : undefined}
      className={cn(isBought && "pointer-events-none")}
    >
      <Card
        data-testid="wishlist-card-v2"
        className={cn(
          "overflow-hidden border-border bg-card",
          isBought && "opacity-45 grayscale",
          isCardInteractive &&
            "cursor-pointer transition-[border-color,box-shadow,transform] hover:border-primary/45 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3),0_0_20px_hsl(263_70%_55%/0.12)] focus-visible:border-primary/45 focus-visible:shadow-[0_8px_24px_rgba(0,0,0,0.3),0_0_20px_hsl(263_70%_55%/0.12)]",
          isSelected && "ring-2 ring-primary/45"
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        <div
          data-testid="wishlist-card-v2-media"
          className="group relative aspect-[4/5] overflow-hidden bg-secondary"
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
          ) : null}
          {showImage ? (
            <Image
              src={imageUrl!}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
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

        <CardHeader className="space-y-1.5 p-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", statusMarker)} aria-hidden />
              <Badge variant="outline" className={cn("text-[11px] font-medium", statusTone)}>
                {getItemStatusLabel(item.status)}
              </Badge>
            </div>
          </div>
          <CardTitle
            data-testid="wishlist-card-v2-title"
            className={cn(
              "line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-[15px]",
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
                          "text-[10px] font-semibold text-white",
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
                  className="shrink-0 text-right text-sm font-semibold tabular-nums tracking-tight text-muted-foreground sm:text-[15px]"
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
                        className="h-11 min-h-[44px] w-full justify-center border-primary/35 px-4 text-sm font-semibold shadow-none hover:border-primary/48 sm:h-9 sm:min-h-9 sm:w-auto sm:min-w-[8rem]"
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
                      {!isBought ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkPurchased();
                          }}
                          disabled={statusPending}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Отметить купленным
                        </DropdownMenuItem>
                      ) : null}
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
    </motion.div>
  );
});
