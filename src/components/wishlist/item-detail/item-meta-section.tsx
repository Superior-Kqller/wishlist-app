"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, ShoppingCart, Trash2, Undo2 } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityBadgeInline } from "@/components/wishlist/priority-badge";
import { UserAvatar } from "@/components/UserAvatar";
import { formatPrice, cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { ProductCategoryIcon } from "@/lib/category-icons";
import { isItemPurchased } from "@/lib/item-status";

type ItemMetaSectionProps = {
  item: WishlistItem;
  canManage: boolean;
  statusPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
};

export function ItemMetaSection({
  item,
  canManage,
  statusPending,
  onEdit,
  onDelete,
  onTogglePurchased,
}: ItemMetaSectionProps) {
  const { language, t } = useI18n();
  const [showFullNotes, setShowFullNotes] = useState(false);
  const hasLongNotes = Boolean(item.notes && item.notes.length > 180);
  const categoryLabel = getProductCategoryLabel(item.category, language);
  const isBought = isItemPurchased(item);
  const noteParagraphs = item.notes
    ?.split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  useEffect(() => {
    setShowFullNotes(false);
  }, [item.id]);

  return (
    <>
      <DialogHeader className="space-y-3 pr-10 sm:pr-12">
        {/*
         * Факты о желании — одной тихой строкой над названием: важность,
         * категория, чьё. Раньше владелец стоял отдельной полосой между двумя
         * линиями, а категория — плашкой в самом низу, после описания: три
         * факта одного рода были разнесены по всему окну.
         */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
          <PriorityBadgeInline priority={item.priority} />
          {item.category ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <ProductCategoryIcon category={item.category} className="size-3.5 shrink-0" />
              <span className="truncate">{categoryLabel}</span>
            </span>
          ) : null}
          {item.user ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
                className="size-[18px] text-[9px]"
              />
              <span className="truncate">{item.user.name}</span>
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <DialogTitle
            className={cn(
              "min-w-0 break-words [overflow-wrap:anywhere] text-left text-2xl font-semibold leading-[1.12] sm:text-[1.75rem]",
              isBought && "line-through",
            )}
          >
            {item.title}
          </DialogTitle>
          {item.price != null && item.price > 0 ? (
            <p className="mt-3 text-[1.75rem] font-bold leading-none tabular-nums tracking-[-0.02em] text-foreground sm:text-[1.85rem]">
              {formatPrice(item.price, item.currency, language)}
            </p>
          ) : null}
        </div>
      </DialogHeader>

      {noteParagraphs?.length ? (
        <section className="max-w-[38rem] space-y-2 pt-1">
          <h3 className="text-[13px] font-semibold text-muted-foreground">{t("Описание")}</h3>
          <div
            className={cn(
              "space-y-2 text-sm leading-6 text-foreground/85 [text-wrap:pretty]",
              hasLongNotes && !showFullNotes && "line-clamp-5",
            )}
          >
            {noteParagraphs.map((paragraph, index) => (
              <p key={`${item.id}-note-${index}`} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
          {hasLongNotes ? (
            <button
              type="button"
              className="rounded-sm text-xs font-medium text-primary-accent hover:text-primary-accent/85 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setShowFullNotes((value) => !value)}
            >
              {showFullNotes ? t("Свернуть") : t("Показать полностью")}
            </button>
          ) : null}
        </section>
      ) : null}

      {(item.url || canManage) && (
        <div className="hidden pt-1 sm:block">
          <ItemDetailActions
            item={item}
            canManage={canManage}
            statusPending={statusPending}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePurchased={onTogglePurchased}
          />
        </div>
      )}
    </>
  );
}

type ItemDetailActionsProps = {
  item: WishlistItem;
  canManage: boolean;
  statusPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
  mobileDock?: boolean;
};

export function ItemDetailActions({
  item,
  canManage,
  statusPending,
  onEdit,
  onDelete,
  onTogglePurchased,
  mobileDock = false,
}: ItemDetailActionsProps) {
  const { t } = useI18n();
  const isBought = isItemPurchased(item);
  const actionButtonClass = cn(
    "justify-center whitespace-nowrap",
    mobileDock ? "h-12 min-h-12 min-w-0 px-3" : "h-10 min-h-10 w-auto px-3",
  );

  return (
    <div
      className={cn(
        "gap-2",
        mobileDock ? "grid grid-cols-[minmax(0,1fr)_auto]" : "flex flex-wrap items-center",
      )}
    >
      {item.url ? (
        <Button asChild className={cn(actionButtonClass, "gap-2", !mobileDock && "min-w-[8.5rem]")}>
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
              className={cn(
                actionButtonClass,
                "gap-2 border-border/55 text-foreground hover:bg-accent",
                mobileDock && !item.url && "w-full",
              )}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              {t("Действия")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              {t("Редактировать")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTogglePurchased} disabled={statusPending}>
              {isBought ? <Undo2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {isBought ? t("Снять отметку") : t("Отметить купленным")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t("Удалить")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
