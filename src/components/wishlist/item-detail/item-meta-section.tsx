"use client";

import { useEffect, useState } from "react";
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
import { useI18n } from "@/components/i18n/language-provider";

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
  const { language, t } = useI18n();
  const [showFullNotes, setShowFullNotes] = useState(false);
  const actionButtonClass =
    "h-11 min-h-[44px] w-full shrink-0 justify-center whitespace-nowrap border-border/60 bg-card/70 px-3 text-foreground backdrop-blur-[8px] hover:border-border/80 hover:bg-accent sm:h-10 sm:min-h-10 sm:w-auto";
  const claimButtonVariant = !item.url && !canManage ? "default" : "outline";
  const hasLongNotes = Boolean(item.notes && item.notes.length > 180);

  useEffect(() => {
    setShowFullNotes(false);
  }, [item.id]);

  return (
    <>
      <DialogHeader className="space-y-1 pr-10 sm:pr-12">
        <div className="min-w-0">
          <DialogTitle
            className={cn(
              "break-words text-left text-lg leading-[1.16] sm:text-[1.35rem]",
              item.purchased && "line-through",
            )}
          >
            {item.title}
          </DialogTitle>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {item.price != null && item.price > 0 ? (
              <p className="mr-1 text-xl font-semibold leading-tight tabular-nums tracking-tight text-foreground sm:text-2xl">
                {formatPrice(item.price, item.currency, language)}
              </p>
            ) : null}
            <StatusBadge status={item.status} className="text-[11px] opacity-85" />
            <PriorityBadge priority={item.priority} className="text-[11px] opacity-85" />
          </div>
        </div>
      </DialogHeader>

      {item.user ? (
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground/82">
          <UserAvatar
            avatarUrl={item.user.avatarUrl || undefined}
            name={item.user.name}
            userId={item.user.id}
            size="sm"
          />
          <span className="truncate">{item.user.name}</span>
        </div>
      ) : null}

      {item.notes ? (
        <div className="max-w-[34rem] space-y-1">
          <p
            className={cn(
              "whitespace-pre-wrap text-sm leading-relaxed text-foreground/72",
              hasLongNotes && !showFullNotes && "line-clamp-4",
            )}
          >
            {item.notes}
          </p>
          {hasLongNotes ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:text-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
              onClick={() => setShowFullNotes((value) => !value)}
            >
              {showFullNotes ? t("Свернуть") : t("Показать полностью")}
            </button>
          ) : null}
        </div>
      ) : null}

      {item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => {
            const color =
              tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
            return (
              <Badge
                key={tag.id}
                variant="outline"
                className="px-1.5 py-0.5 text-[11px] opacity-90"
                style={{ borderColor: color, color }}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      ) : null}

      {(item.url || canManage || canClaim) && (
        <div className="grid gap-2 border-t border-border/45 pt-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {item.url ? (
            <Button
              asChild
              className="h-11 min-h-[44px] w-full shrink-0 justify-center gap-2 px-3 sm:h-10 sm:min-h-10 sm:w-auto"
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 shrink-0" />
                {t("Открыть ссылку")}
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
                  {t("Действия")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("Редактировать")}
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
                    ? t("Снять отметку")
                    : t("Отметить купленным")}
                </DropdownMenuItem>
                {canClaim ? (
                  <DropdownMenuItem
                    onClick={onClaimAction}
                    disabled={statusPending}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    {item.status === "CLAIMED" ? t("Снять бронь") : t("Забронировать")}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("Удалить")}
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
              {item.status === "CLAIMED" ? t("Снять бронь") : t("Забронировать")}
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
