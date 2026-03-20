"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Check, Globe2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { wishlistPriorityToTier } from "@/lib/wish-card-priority";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "./icon-button";

export interface WishCardProps {
  item: WishlistItem;
  collectionName?: string | null;
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
  collectionName,
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
  const priorityTier = wishlistPriorityToTier(item.priority);
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
          "overflow-hidden border-purple-500/40 bg-card/80 shadow-[0_12px_40px_rgba(88,28,135,0.35)]",
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
          <PriorityBadgeOverlay tier={priorityTier} />
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
          {collectionName ? (
            <Badge
              variant="secondary"
              className="h-5 max-w-full truncate border-purple-500/30 bg-purple-950/40 px-2 py-0 text-[10px] font-medium uppercase tracking-wide text-slate-400"
            >
              {collectionName}
            </Badge>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-2 p-3 pt-0">
          {item.price != null && (
            <p
              data-testid="wishlist-card-v2-price"
              className="text-base font-bold tabular-nums tracking-tight text-fuchsia-300"
            >
              {formatPrice(item.price, item.currency)}
            </p>
          )}
          {ownerName ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-7 w-7">
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
          ) : null}
        </CardContent>

        <CardFooter
          data-testid="wishlist-card-v2-footer"
          className="flex flex-wrap items-center gap-2 p-3 pt-0"
        >
          {item.url || canManage ? (
            <TooltipProvider delayDuration={200}>
              <div className="flex w-full flex-wrap items-center gap-2">
              {item.url ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="border-purple-500/45" asChild>
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
                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  {!isBought ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          type="button"
                          data-testid="wishlist-card-toggle-purchased"
                          intent="success"
                          disabled={statusPending}
                          aria-label="Отметить купленным"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkPurchased();
                          }}
                        >
                          <Check className="h-4 w-4" />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
