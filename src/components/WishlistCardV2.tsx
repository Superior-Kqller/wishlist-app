"use client";

import { memo, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrioritySelect } from "./PrioritySelect";
import { PriorityBadge } from "./PriorityBadge";
import { UserAvatar } from "./UserAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { ExternalLink, Pencil, ShoppingCart, Trash2, Undo2, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface WishlistCardV2Props {
  item: WishlistItem;
  currentUserId?: string;
  index?: number;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => void;
  statusPending?: boolean;
  onPriorityChange?: (id: string, priority: number) => void;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const WishlistCardV2 = memo(function WishlistCardV2({
  item,
  currentUserId,
  index = 0,
  onEdit,
  onDelete,
  onTogglePurchased,
  onSetStatus,
  statusPending = false,
  onPriorityChange,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
}: WishlistCardV2Props) {
  const accentPalette = ["#7C3AED", "#A78BFA", "#EC4899", "#06B6D4", "#F97316", "#EAB308"];
  const accentSeed = item.userId || item.user?.id || item.id;
  const accentIndex = Array.from(accentSeed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % accentPalette.length;
  const accentColor = accentPalette[accentIndex];

  const [imageError, setImageError] = useState(false);
  const image = item.images?.[0];
  const isOwner = currentUserId === item.userId;
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card
        data-testid="wishlist-card-v2"
        style={{ borderTopColor: accentColor, borderLeftColor: accentColor }}
        className={cn(
          "overflow-hidden border-t-4 border-l-3",
          item.purchased && "opacity-70",
          isCardInteractive && "cursor-pointer",
          isSelected && "shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        <div
          data-testid="wishlist-card-v2-media"
          className="relative aspect-[4/3] overflow-hidden bg-muted/70"
        >
          {image && !imageError ? (
            <Image
              src={image}
              alt={item.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
            </div>
          )}
        </div>

        <div className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3
                    data-testid="wishlist-card-v2-title"
                    tabIndex={0}
                    className={cn(
                      "line-clamp-2 text-sm font-medium leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      item.purchased && "line-through"
                    )}
                  >
                    {item.title}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>{item.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {(item.url || isOwner) && (
              <TooltipProvider delayDuration={120}>
                <div className="flex shrink-0 items-center gap-1">
                {item.url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Открыть ссылку"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Открыть ссылку</TooltipContent>
                  </Tooltip>
                )}
                {isOwner && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-testid="wishlist-card-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          disabled={statusPending}
                          aria-label="Редактировать"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Редактировать</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          data-testid="wishlist-card-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSetStatus) {
                              onSetStatus(item.id, item.status === "PURCHASED" ? "AVAILABLE" : "PURCHASED");
                            } else {
                              onTogglePurchased(item.id, !item.purchased);
                            }
                          }}
                          disabled={statusPending}
                          aria-label={item.status === "PURCHASED" ? "Снять отметку" : "Отметить купленным"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {item.status === "PURCHASED" ? <Undo2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{item.status === "PURCHASED" ? "Снять отметку" : "Отметить купленным"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          aria-label="Удалить"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Удалить</TooltipContent>
                    </Tooltip>
                  </>
                )}
                </div>
              </TooltipProvider>
            )}
          </div>

          {item.status === "CLAIMED" && <Badge variant="secondary">Забронировано</Badge>}
          {item.status === "PURCHASED" && <Badge>Куплено</Badge>}

          <div data-testid="wishlist-card-v2-footer" className="flex items-center justify-between gap-2">
            <span data-testid="wishlist-card-v2-price" className="text-sm font-semibold tabular-nums">
              {item.price ? formatPrice(item.price, item.currency) : "Цена не указана"}
            </span>
            <div data-testid="wishlist-card-priority">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Приоритет</span>
                {isOwner ? (
                  <PrioritySelect
                    priority={item.priority}
                    onChange={onPriorityChange ? (priority) => onPriorityChange(item.id, priority) : undefined}
                    triggerTestId="priority-select-trigger"
                    ariaLabel={`Приоритет ${item.title}`}
                  />
                ) : (
                  <PriorityBadge priority={item.priority} />
                )}
              </div>
            </div>
          </div>

          {item.user?.name && (
            <div className="flex items-center gap-2">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
              />
              <span className="text-[10px] text-muted-foreground">{item.user.name}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
