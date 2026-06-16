"use client";

import { memo, type KeyboardEvent, useState } from "react";
import Image from "next/image";
import {
  Check,
  ExternalLink,
  Globe2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
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
import { StatusBadge } from "@/components/wishlist/status-badge";
import { cn, formatPrice } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";

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
  const isBought = item.purchased || item.status === "PURCHASED";
  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";
  const ownerName = item.user?.name;
  const ownerId = item.user?.id ?? item.userId;
  const ownerImage = item.user?.avatarUrl ?? null;
  const showImage = Boolean(imageUrl && !imageError);
  const isInteractive = Boolean(onOpenDetail || selectionMode);

  const handleRowClick = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRowClick();
    }
  };

  const handleMarkPurchased = () => {
    if (onSetStatus) {
      onSetStatus(item.id, item.status === "PURCHASED" ? "AVAILABLE" : "PURCHASED");
    } else {
      onTogglePurchased(item.id, !item.purchased);
    }
  };

  return (
    <TableRow
      data-testid="wishlist-product-row"
      className={cn(
        "group/row outline-none",
        isInteractive &&
          "cursor-pointer focus-visible:bg-muted/45 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/10",
        isBought && "opacity-55",
      )}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleRowClick : undefined}
      onKeyDown={handleRowKeyDown}
    >
      <TableCell className="min-w-[22rem]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-[hsl(var(--surface-1))]">
            {showImage ? (
              <Image
                src={imageUrl!}
                alt={item.title}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Globe2 className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "line-clamp-1 text-sm font-semibold text-foreground",
                isBought && "line-through",
              )}
            >
              {item.title}
            </p>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                {t("Открыть товар")}
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
                    "text-[10px] font-semibold text-primary-foreground",
                    getAvatarColor(ownerId),
                  )}
                >
                  {getInitials(ownerName)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">
              {ownerName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <StatusBadge status={item.status} />
      </TableCell>

      <TableCell className="text-right font-semibold tabular-nums">
        {item.price != null ? formatPrice(item.price, item.currency, language) : "—"}
      </TableCell>

      <TableCell>
        <div className="flex max-w-[14rem] flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="max-w-[8rem] truncate text-[10px]">
              {tag.name}
            </Badge>
          ))}
          {item.tags.length > 3 ? (
            <Badge variant="secondary" className="text-[10px]">
              +{item.tags.length - 3}
            </Badge>
          ) : null}
        </div>
      </TableCell>

      <TableCell className="w-[4rem] text-right">
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="iconToolbar"
                aria-label={t("Действия с товаром")}
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
                {isBought ? (
                  <Undo2 className="mr-2 h-4 w-4" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
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
          <span className="text-xs text-muted-foreground">
            {isSelected ? t("Выбрано") : t("Выбрать")}
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  );
});
