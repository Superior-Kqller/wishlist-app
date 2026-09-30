"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeInline } from "./priority-badge";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { isItemPurchased, type ItemStatus } from "@/lib/item-status";
import { ItemActionsMenu } from "./item-actions-menu";

interface WishCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  statusPending?: boolean;
  /** Товар только что отмечен купленным в этой сессии. */
  justPurchased?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  hideOwner?: boolean;
}

export const WishCard = memo(function WishCard({
  item,
  onEdit,
  onDelete,
  onSetStatus,
  statusPending = false,
  justPurchased = false,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
  currentUserId,
  currentUserRole,
  hideOwner = false,
}: WishCardProps) {
  const { language, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  // Подложка светлеет только под загруженным снимком: пока он грузится или
  // если ссылка мертва, кадр остаётся тёмным, а не пустым светлым окном.
  const [imageLoaded, setImageLoaded] = useState(false);
  // Почти квадратный снимок заполняет плитку (DESIGN.md → «Карточка желания»),
  // вытянутый вписывается с отступом, чтобы товар не обрезался.
  const [fillTile, setFillTile] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const isBought = isItemPurchased(item);

  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";

  const ownerName = hideOwner ? undefined : item.user?.name;
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

  const showImage = Boolean(imageUrl && !imageError);
  // Без снимка плитка показывает заметку и магазин — ради них такое желание и записывали.
  const shopHost = (() => {
    if (!item.url) return null;
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();
  const categoryLabel = getProductCategoryLabel(item.category, language);
  const Wrapper = isCardInteractive ? "button" : "div";
  const overlayButtonClass =
    "size-9 min-h-9 min-w-9 rounded-full border-transparent bg-background/95 text-foreground shadow-[var(--shadow-float)] hover:bg-background";

  /*
   * DESIGN.md → «Карточка желания»: фото 1:1 без рамки у самой карточки,
   * плашка статуса слева сверху, действия — круглыми кнопками справа сверху;
   * ниже название, владелец и категория, цена.
   */
  return (
    <div
      data-testid="wishlist-card-v2"
      className={cn("group/card relative flex h-full min-w-0 flex-col", isBought && "opacity-80")}
    >
      <Wrapper
        type={isCardInteractive ? "button" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col rounded-xl text-left",
          isCardInteractive &&
            "cursor-pointer appearance-none bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={isCardInteractive ? handleCardClick : undefined}
        aria-pressed={selectionMode ? isSelected : undefined}
      >
        <div
          data-testid={showImage ? "wishlist-card-v2-media" : undefined}
          className={cn(
            "relative aspect-square w-full shrink-0 overflow-hidden rounded-xl",
            showImage && imageLoaded ? "media-tile" : "bg-[hsl(var(--surface-3))]",
            isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
        >
          {showImage ? (
            /* Снимки приходят в разных пропорциях: квадратный (от 4:5 до 5:4) идёт
               на всю плитку — срезается не больше десятой доли с каждой стороны; вытянутый
               вписывается целиком, `contain` не срезает товар. */
            <Image
              src={imageUrl!}
              alt=""
              fill
              className={cn("wish-card-image", fillTile ? "object-cover" : "object-contain p-6")}
              sizes="(max-width: 744px) 50vw, (max-width: 1128px) 33vw, 25vw"
              unoptimized
              onLoad={(event) => {
                const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
                setFillTile(h > 0 && w / h >= 0.8 && w / h <= 1.25);
                setImageLoaded(true);
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            // Угол плитки занят плашкой важности; категория подписана под названием.
            <div className="flex size-full flex-col justify-end p-4">
              <div className="min-w-0 space-y-1.5">
                {item.notes ? (
                  <p className="line-clamp-4 text-sm leading-snug text-[hsl(var(--foreground)/0.8)]">
                    {item.notes}
                  </p>
                ) : null}
                {shopHost ? (
                  <p className="truncate text-xs text-muted-foreground">{shopHost}</p>
                ) : null}
              </div>
            </div>
          )}

          {selectionMode ? (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[var(--shadow-float)]",
                isSelected ? "bg-foreground text-background" : "bg-background text-foreground",
              )}
            >
              {isSelected ? t("Выбрано") : t("Выбрать")}
            </span>
          ) : isBought ? (
            <span
              data-testid="wishlist-card-v2-purchased-label"
              className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-success shadow-[var(--shadow-float)]"
            >
              {/* Success Check (kinetics): кольцо, затем галочка — только в момент отметки. */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  className={justPurchased ? "draw-ring" : undefined}
                  style={{ "--draw-length": 63 } as React.CSSProperties}
                />
                <path
                  d="M7.5 12.5l3 3 6-6.5"
                  className={justPurchased ? "draw-tick" : undefined}
                  style={{ "--draw-length": 14 } as React.CSSProperties}
                />
              </svg>
              {t("Уже куплено")}
            </span>
          ) : (
            // DESIGN.md → «Карточка желания»: важность — белой плашкой поверх фото.
            <PriorityBadgeInline
              priority={item.priority}
              className="absolute left-3 top-3 max-w-[calc(100%-6.5rem)] rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-[var(--shadow-float)]"
            />
          )}
        </div>

        <div data-testid="wishlist-card-v2-footer" className="flex min-w-0 flex-col gap-1 pt-3">
          <h3
            data-testid="wishlist-card-v2-title"
            className={cn(
              "line-clamp-2 text-base font-semibold leading-tight text-foreground",
              isBought && "line-through decoration-muted-foreground/55",
            )}
          >
            {item.title}
          </h3>

          <div
            data-testid="wishlist-card-v2-meta"
            className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
          >
            {ownerName ? (
              <span
                data-testid="wishlist-card-v2-owner"
                className="inline-flex min-w-0 items-center gap-1.5"
              >
                <span className="relative size-5 shrink-0 overflow-hidden rounded-full">
                  {ownerImage && !ownerImageError ? (
                    <Image
                      src={ownerImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="20px"
                      unoptimized={ownerImage.startsWith("/uploads/")}
                      onError={() => setOwnerImageError(true)}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className={cn("block size-full rounded-full", getAvatarColor(ownerId))}
                    />
                  )}
                </span>
                <span className="min-w-0 truncate">{ownerName}</span>
              </span>
            ) : null}
            {item.category ? (
              <span data-testid="wishlist-card-v2-category" className="min-w-0 truncate">
                {categoryLabel}
              </span>
            ) : null}
          </div>

          {item.price != null ? (
            <p
              data-testid="wishlist-card-v2-price"
              className="min-w-0 truncate pt-0.5 text-base font-semibold tabular-nums text-foreground"
            >
              {formatPrice(item.price, item.currency, language)}
            </p>
          ) : null}
        </div>
      </Wrapper>

      {/* Действия — вне кнопки карточки: вложенные интерактивные элементы недопустимы. */}
      {!selectionMode && (item.url || canManage) ? (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {item.url ? (
            <Button
              variant="ghost"
              size="icon"
              asChild
              title={t("Открыть в новой вкладке")}
              aria-label={t("Открыть ссылку на товар в новой вкладке")}
              className={overlayButtonClass}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          ) : null}
          {canManage ? (
            <ItemActionsMenu
              item={item}
              statusPending={statusPending}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetStatus={onSetStatus}
              label={t("Действия с карточкой")}
              testId="wishlist-card-actions"
              triggerClassName={overlayButtonClass}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
