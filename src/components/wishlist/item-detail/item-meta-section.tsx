"use client";

import {
  Clock3,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  ShoppingCart,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadge } from "@/components/PriorityBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/wishlist/status-badge";
import { formatPrice, getTagColor, cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

type ItemMetaSectionProps = {
  item: WishlistItem;
  canManage: boolean;
  canClaim: boolean;
  statusPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
  onClaimAction: () => void;
};

export function ItemMetaSection({
  item,
  canManage,
  canClaim,
  statusPending,
  onEdit,
  onDelete,
  onTogglePurchased,
  onClaimAction,
}: ItemMetaSectionProps) {
  const actionButtonClass =
    "h-11 min-h-[44px] w-full shrink-0 justify-center whitespace-nowrap border-border bg-card/85 px-3 text-foreground backdrop-blur-[8px] hover:border-border/90 hover:bg-accent sm:h-9 sm:min-h-9 sm:w-auto";
  const claimButtonVariant = !item.url && !canManage ? "default" : "outline";

  return (
    <>
      <DialogHeader className="space-y-3 pr-10 sm:pr-12">
        <div className="min-w-0">
          <DialogTitle
            className={cn(
              "break-words text-left text-lg leading-snug sm:text-xl",
              item.purchased && "line-through",
            )}
          >
            {item.title}
          </DialogTitle>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
          </div>
        </div>
      </DialogHeader>

      {(item.user || (item.price != null && item.price > 0)) && (
        <div className="flex items-center justify-between gap-3">
          {item.user ? (
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
              />
              <span className="truncate">{item.user.name}</span>
            </div>
          ) : (
            <span className="min-w-0 shrink" aria-hidden />
          )}
          {item.price != null && item.price > 0 ? (
            <div className="shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Ориентировочная стоимость
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatPrice(item.price, item.currency)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {item.notes ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {item.notes}
        </p>
      ) : null}

      {item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => {
            const color =
              tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
            return (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: color, color }}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      ) : null}

      {(item.url || canManage || canClaim) && (
        <div className="grid gap-2 border-t border-border pt-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:pt-3">
          {item.url ? (
            <Button
              asChild
              className="h-11 min-h-[44px] w-full shrink-0 justify-center gap-2 px-3 sm:h-9 sm:min-h-9 sm:w-auto"
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 shrink-0" />
                Открыть ссылку
              </a>
            </Button>
          ) : null}
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(actionButtonClass, "gap-2 sm:ml-auto")}
                >
                  <MoreHorizontal className="h-4 w-4 shrink-0" />
                  Действия
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onTogglePurchased}
                  disabled={statusPending}
                >
                  {item.status === "PURCHASED" ? (
                    <Undo2 className="mr-2 h-4 w-4" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  {item.status === "PURCHASED"
                    ? "Снять отметку"
                    : "Отметить купленным"}
                </DropdownMenuItem>
                {canClaim ? (
                  <DropdownMenuItem
                    onClick={onClaimAction}
                    disabled={statusPending}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    {item.status === "CLAIMED" ? "Снять бронь" : "Забронировать"}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {!canManage && canClaim ? (
            <Button
              variant={claimButtonVariant}
              size="sm"
              onClick={onClaimAction}
              className={cn(
                claimButtonVariant === "outline" && actionButtonClass,
              )}
              disabled={statusPending}
            >
              {item.status === "CLAIMED" ? "Снять бронь" : "Забронировать"}
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
