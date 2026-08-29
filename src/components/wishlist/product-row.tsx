"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Check, ExternalLink, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { cn, formatPrice } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { getPurchaseToggleTarget, isItemPurchased } from "@/lib/item-status";
import { ProductCategoryIcon } from "@/lib/category-icons";

export interface ProductRowProps {
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

export const ProductRow = memo(function ProductRow({
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
}: ProductRowProps) {
  const { language, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);
  const imageUrl = item.images?.[0] ?? null;
  const isBought = isItemPurchased(item);
  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";
  const ownerName = item.user?.name;
  const ownerId = item.user?.id ?? item.userId;
  const ownerImage = item.user?.avatarUrl ?? null;
  const showImage = Boolean(imageUrl && !imageError);
  const isInteractive = Boolean(onOpenDetail || selectionMode);
  const categoryLabel = getProductCategoryLabel(item.category, language);

  const handleRowClick = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  const handleMarkPurchased = () => {
    if (onSetStatus) {
      onSetStatus(item.id, getPurchaseToggleTarget(item));
    } else {
      onTogglePurchased(item.id, !item.purchased);
    }
  };

  return (
    <TableRow
      data-testid="wishlist-product-row"
      className={cn(
        "group/row outline-none",
        isInteractive && "cursor-pointer",
        isSelected && "bg-primary/10",
        isBought && "opacity-55",
      )}
      onClick={isInteractive ? handleRowClick : undefined}
    >
      <TableCell className="min-w-[22rem]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-[hsl(var(--surface-1))]">
            {showImage ? (
              <Image
                src={imageUrl!}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              /*
               * Отсутствие снимка не украшается. Здесь стоял глобус — иконка,
               * которая не означает «нет фотографии» ни в одном словаре, а
               * повторённая на каждой строке читалась как столбец одинакового
               * шума. Клетка остаётся ради выравнивания столбца, но пустая:
               * та же тонировка, что у кадра карточки без снимка.
               */
              <div className="h-full w-full bg-[linear-gradient(140deg,hsl(var(--surface-3))_0%,hsl(var(--surface-1))_100%)]" />
            )}
          </div>
          <div className="min-w-0">
            {isInteractive ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleRowClick();
                }}
                className={cn(
                  "line-clamp-1 rounded-sm text-left text-sm font-semibold text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isBought && "line-through",
                )}
              >
                {item.title}
              </button>
            ) : (
              <p
                className={cn(
                  "line-clamp-1 text-sm font-semibold text-foreground",
                  isBought && "line-through",
                )}
              >
                {item.title}
              </p>
            )}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {t("Открыть в магазине")}
              </a>
            ) : null}
          </div>
        </div>
      </TableCell>

      <TableCell className="min-w-[10rem]">
        {ownerName ? (
          <div className="flex min-w-0 items-center gap-2">
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
                    "text-[10px] font-semibold text-avatar-foreground",
                    getAvatarColor(ownerId),
                  )}
                >
                  {getInitials(ownerName)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">{ownerName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="text-right font-semibold tabular-nums">
        {item.price != null ? formatPrice(item.price, item.currency, language) : "—"}
      </TableCell>

      <TableCell>
        {item.category ? (
          <Badge variant="outline" className="max-w-[10rem] gap-1.5 truncate text-[10px]">
            <ProductCategoryIcon category={item.category} className="size-3.5 shrink-0" />
            {categoryLabel}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="w-[3rem] text-right">
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="iconToolbar"
                aria-label={t("Действия с желанием")}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleMarkPurchased();
                }}
                disabled={statusPending}
              >
                {isBought ? <Undo2 className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                {isBought ? t("Вернуть в доступные") : t("Отметить купленным")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(item);
                }}
                disabled={statusPending}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("Редактировать")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("Удалить")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : selectionMode ? (
          // Раньше здесь стоял неинтерактивный <span>: он выглядел как контрол,
          // не получал фокус и не сообщал состояние выбора скринридеру.
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect?.(item.id);
            }}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isSelected ? t("Выбрано") : t("Выбрать")}
          </button>
        ) : null}
      </TableCell>
    </TableRow>
  );
});
