"use client";

import { useState, memo, type KeyboardEvent } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityStars } from "./PriorityStars";
import { UserAvatar } from "./UserAvatar";
import { WishlistItem } from "@/types";
import { formatPrice, cn, getTagColor, priorityBorderClass } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  ShoppingCart,
  Trash2,
  Undo2,
  ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";

interface WishlistCardProps {
  item: WishlistItem;
  index?: number;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onPriorityChange?: (id: string, priority: number) => void;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const WishlistCard = memo(function WishlistCard({
  item,
  index = 0,
  onEdit,
  onDelete,
  onTogglePurchased,
  onPriorityChange,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
}: WishlistCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = item.images?.length ? item.images : [];
  const mainImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  const isCardInteractive = Boolean(onOpenDetail || selectionMode);

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
        className={cn(
          "group overflow-hidden glass-card",
          priorityBorderClass(item.priority),
          item.purchased && "opacity-70",
          isCardInteractive && "cursor-pointer",
          isCardInteractive &&
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isSelected && "shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_0_15px_hsl(var(--primary)/0.25)] scale-[1.01] brightness-[1.03]",
        )}
        role={isCardInteractive ? "button" : undefined}
        tabIndex={isCardInteractive ? 0 : undefined}
        aria-label={
          isCardInteractive
            ? selectionMode
              ? `Выбрать: ${item.title}`
              : `Подробнее: ${item.title}`
            : undefined
        }
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={isCardInteractive ? handleCardClick : undefined}
        onKeyDown={isCardInteractive ? handleCardKeyDown : undefined}
      >
        {/* Image */}
        <div
          className="relative aspect-[4/3] bg-muted overflow-hidden select-none"
          onTouchStart={(e) => {
            if (hasMultipleImages) (e.currentTarget as HTMLElement).dataset.touchX = String(e.touches[0].clientX);
          }}
          onTouchEnd={(e) => {
            if (!hasMultipleImages) return;
            const el = e.currentTarget as HTMLElement;
            const start = Number(el.dataset.touchX);
            const end = e.changedTouches[0]?.clientX ?? start;
            const diff = start - end;
            if (Number.isFinite(start) && Math.abs(diff) > 40) {
              if (diff > 0) setCurrentImageIndex((i) => Math.min(images.length - 1, i + 1));
              else setCurrentImageIndex((i) => Math.max(0, i - 1));
            }
          }}
        >
          {mainImage && !imageError ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                item.purchased && "grayscale"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/2gAMAwEAAhEDEEA/AL8AB//Z"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
            </div>
          )}

          {/* Prev/Next arrows */}
          {hasMultipleImages && !imageError && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
                  setImageError(false);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary [@media(hover:none)]:opacity-70"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex((i) => (i + 1) % images.length);
                  setImageError(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary [@media(hover:none)]:opacity-70"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Gallery dots */}
          {hasMultipleImages && !imageError && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(i);
                    setImageError(false);
                  }}
                  className={cn(
                    "p-1 rounded-full transition-colors min-w-[24px] min-h-[24px] flex items-center justify-center",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
                    i === currentImageIndex
                      ? "bg-primary/80 ring-1 ring-primary ring-offset-1 ring-offset-transparent"
                      : "bg-white/50 hover:bg-white/70"
                  )}
                  aria-label={`Фото ${i + 1}`}
                  aria-current={i === currentImageIndex ? "true" : undefined}
                >
                  <span className={cn(
                    "block w-1.5 h-1.5 rounded-full",
                    i === currentImageIndex ? "bg-primary-foreground" : "bg-white"
                  )} />
                </button>
              ))}
            </div>
          )}

          {/* Selection checkbox */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background/80 border-muted-foreground/40",
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}

          {/* Purchased overlay */}
          {item.purchased && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-12 h-12 rounded-full bg-[hsl(var(--success)/0.2)] flex items-center justify-center"
              >
                <Check className="w-6 h-6 text-[hsl(var(--success))]" />
              </motion.div>
            </div>
          )}

          {/* Action buttons */}
          <div
            className={cn(
              "absolute top-2 right-2 flex gap-1 transition-opacity duration-200",
              showActions ? "opacity-100" : "opacity-0"
            )}
          >
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-sm focus-ring"
                title="Открыть ссылку"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-sm focus-ring"
              title="Редактировать"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePurchased(item.id, !item.purchased);
              }}
              className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background transition-colors shadow-sm focus-ring"
              title={item.purchased ? "Снять отметку" : "Отметить купленным"}
            >
              {item.purchased ? (
                <Undo2 className="w-3.5 h-3.5" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-destructive/90 backdrop-blur flex items-center justify-center hover:bg-destructive transition-colors shadow-sm text-destructive-foreground focus-ring"
              title="Удалить"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price badge */}
          {item.price && (
            <div className="absolute bottom-2 left-2">
              <span className="px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur text-sm font-semibold tabular-nums shadow-sm">
                {formatPrice(item.price, item.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-medium text-sm leading-snug line-clamp-2",
                item.purchased && "line-through"
              )}
            >
              {item.title}
            </h3>
            <PriorityStars
              priority={item.priority}
              onChange={onPriorityChange ? (p) => onPriorityChange(item.id, p) : undefined}
            />
          </div>

          {item.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.notes}
            </p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => {
                const color = tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
                return (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                    style={{ borderColor: color, color }}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          )}

          {item.user?.name && (
            <div className="flex items-center gap-2">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
              />
              <span className="text-[10px] text-muted-foreground">
                {item.user.name}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});
