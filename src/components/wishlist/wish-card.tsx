"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Check, Globe2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "./icon-button";

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
}: WishCardProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [imageError, setImageError] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const isBought = item.purchased || item.status === "PURCHASED";

  const sessionUserId = session?.user?.id;
  const isSessionReady = sessionStatus !== "loading";
  const canManage =
    isSessionReady &&
    (sessionUserId === item.userId || session?.user?.role === "ADMIN");

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
          "overflow-hidden border-purple-500/35 bg-card/50 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-lg",
          "sm:bg-zinc-950/91 sm:backdrop-blur-2xl sm:shadow-[0_16px_48px_rgba(88,28,135,0.22),0_0_0_1px_rgba(168,85,247,0.14)]",
          isBought && "opacity-45 grayscale",
          isCardInteractive && "cursor-pointer",
          isSelected && "shadow-[0_0_0_2px_rgba(192,38,211,0.45)]"
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        <div
          data-testid="wishlist-card-v2-media"
          className="group relative aspect-[4/5] overflow-hidden bg-slate-900/55"
        >
          <PriorityBadgeOverlay priority={item.priority} />
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
              <Globe2 className="h-14 w-14 text-slate-500/55" aria-hidden />
            </div>
          )}
        </div>

        <CardHeader className="space-y-1.5 p-3 pb-2">
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
                  <span className="min-w-0 truncate text-xs text-slate-400">{ownerName}</span>
                </div>
              ) : (
                <span className="min-w-0 shrink" aria-hidden />
              )}
              {item.price != null ? (
                <p
                  data-testid="wishlist-card-v2-price"
                  className="shrink-0 text-right text-sm font-semibold tabular-nums tracking-tight text-muted-foreground sm:text-[15px] sm:text-violet-200/75"
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
          {item.url || canManage ? (
            <TooltipProvider delayDuration={450} skipDelayDuration={200}>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                {item.url ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="glass"
                        asChild
                        className="h-11 min-h-[44px] w-full justify-center border-primary/28 px-4 text-sm font-semibold shadow-none hover:border-primary/40 sm:h-9 sm:min-h-9 sm:w-auto sm:min-w-[8rem]"
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

                {canManage ? (
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:justify-end">
                    {!isBought ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            type="button"
                            data-testid="wishlist-card-toggle-purchased"
                            intent="success"
                            disabled={statusPending}
                            aria-label="Отметить купленным"
                            className="w-full min-w-0 sm:w-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkPurchased();
                            }}
                          >
                            <Check className="h-5 w-5" />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent>Отметить купленным</TooltipContent>
                      </Tooltip>
                    ) : null}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          type="button"
                          data-testid="wishlist-card-edit"
                          intent="default"
                          disabled={statusPending}
                          aria-label="Редактировать"
                          className="w-full min-w-0 sm:w-11"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                        >
                          <Pencil className="h-5 w-5" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Редактировать</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          type="button"
                          data-testid="wishlist-card-delete"
                          intent="danger"
                          aria-label="Удалить"
                          className={cn(
                            "w-full min-w-0 sm:w-11",
                            // второй ряд на мобильном, если три действия
                            !isBought && "col-span-2 sm:col-span-1",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Удалить</TooltipContent>
                    </Tooltip>
                  </div>
                ) : null}
              </div>
            </TooltipProvider>
          ) : null}
        </CardFooter>

      </Card>
    </motion.div>
  );
});
