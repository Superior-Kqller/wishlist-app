"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { ProductCategoryIcon } from "@/lib/category-icons";
import { isItemPurchased, type ItemStatus } from "@/lib/item-status";
import { cn, formatPrice } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { ItemActionsMenu } from "./item-actions-menu";
import { PriorityBadgeInline } from "./priority-badge";

interface WishListRowProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  statusPending?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
}

/**
 * Желание одной строкой — вид «список» на телефоне.
 *
 * Таблица на узком экране превращалась в горизонтальную прокрутку, а карточка
 * со снимком занимает пол-экрана: за один взгляд помещалось два желания.
 * Строка держит то же самое — снимок, название, цену, важность и категорию —
 * в 85px высоты (с длинным названием — в 103px).
 */
export const WishListRow = memo(function WishListRow({
  item,
  onEdit,
  onDelete,
  onSetStatus,
  statusPending = false,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
  currentUserId,
  currentUserRole,
}: WishListRowProps) {
  const { language, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const showImage = Boolean(imageUrl && !imageError);
  const isBought = isItemPurchased(item);
  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";
  const isInteractive = Boolean(onOpenDetail || selectionMode);
  const categoryLabel = getProductCategoryLabel(item.category, language);

  const handleOpen = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  return (
    <li
      data-testid="wishlist-list-row"
      className={cn(
        "relative flex min-w-0 items-center gap-3 py-2.5 pl-2.5 pr-1 transition-colors duration-[var(--dur-base)]",
        isInteractive && "hover:bg-[hsl(var(--surface-3)/0.45)]",
        isSelected && "bg-[hsl(var(--surface-4)/0.7)]",
      )}
    >
      <div
        className={cn(
          "relative size-14 shrink-0 overflow-hidden rounded-xl",
          showImage && imageLoaded
            ? "media-tile"
            : showImage
              ? "bg-[hsl(var(--surface-1))]"
              : "flex items-center justify-center bg-[hsl(var(--surface-3))] text-muted-foreground",
        )}
      >
        {showImage ? (
          <Image
            src={imageUrl!}
            alt=""
            fill
            className={cn("object-contain p-1.5", isBought && "grayscale")}
            sizes="56px"
            unoptimized
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : item.category ? (
          <ProductCategoryIcon category={item.category} className="size-6" />
        ) : null}
        {isBought ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--success)/0.24)] text-success">
            <Check className="size-7" strokeWidth={2.6} aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
         * Название занимает всю ширину, под ним цена с важностью, ниже —
         * категория и владелец. Цена справа от названия отнимала у него треть
         * ширины: короткие названия ломались в две строки, а владелец
         * случайно переезжал на третью.
         */}
        <div className="min-w-0">
          {/*
           * Название — единственная кнопка строки, растянутая на всю её площадь
           * (`after:inset-0`): вся строка открывается касанием, а меню справа
           * остаётся отдельной кнопкой, не вложенной в другую.
           */}
          {isInteractive ? (
            <button
              type="button"
              onClick={handleOpen}
              aria-pressed={selectionMode ? isSelected : undefined}
              className={cn(
                "line-clamp-2 min-w-0 rounded-sm text-left text-[15px] font-semibold leading-[1.28] text-foreground",
                "after:absolute after:inset-0 after:content-['']",
                "focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring",
                isBought && "text-muted-foreground line-through decoration-muted-foreground/55",
              )}
            >
              {item.title}
            </button>
          ) : (
            <h3
              className={cn(
                "line-clamp-2 min-w-0 text-[15px] font-semibold leading-[1.28] text-foreground",
                isBought && "text-muted-foreground line-through decoration-muted-foreground/55",
              )}
            >
              {item.title}
            </h3>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-x-2.5 whitespace-nowrap text-xs text-muted-foreground">
          {item.price != null ? (
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                isBought ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {formatPrice(item.price, item.currency, language)}
            </span>
          ) : null}
          {isBought ? (
            <span
              data-testid="wishlist-list-row-purchased-label"
              className="shrink-0 font-semibold text-success"
            >
              {t("Уже куплено")}
            </span>
          ) : (
            <PriorityBadgeInline priority={item.priority} />
          )}
        </div>
        {/* Категория и владелец — своей строкой: рядом с ценой и важностью они не помещались. */}
        {item.category || item.user?.name ? (
          <p className="truncate text-xs text-muted-foreground">
            {[item.category ? categoryLabel : null, item.user?.name].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>

      {/* Поверх растянутой кнопки названия: действия ловят касание сами. */}
      <div className="relative z-10 shrink-0">
        {canManage ? (
          <ItemActionsMenu
            item={item}
            statusPending={statusPending}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetStatus={onSetStatus}
            label={t("Действия с желанием")}
            triggerClassName="text-muted-foreground hover:text-foreground"
            iconClassName="h-[1.125rem] w-[1.125rem]"
          />
        ) : item.url ? (
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={t("Открыть ссылку на товар в новой вкладке")}
            className="text-muted-foreground hover:text-foreground"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
});
