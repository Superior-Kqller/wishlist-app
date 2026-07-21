"use client";

import { useEffect, useState } from "react";
import {
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
import { formatPrice, cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryIcon, getProductCategoryLabel } from "@/lib/categories";

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
  const actionButtonClass =
    "h-11 min-h-[44px] min-w-[8.5rem] flex-1 basis-[8.5rem] shrink justify-center whitespace-nowrap border-border/58 bg-transparent px-3 text-foreground hover:border-primary/34 hover:bg-accent sm:h-10 sm:min-h-10 sm:w-auto sm:flex-none sm:basis-auto";
  const hasLongNotes = Boolean(item.notes && item.notes.length > 180);
  const categoryLabel = getProductCategoryLabel(item.category, language);
  const categoryIcon = getProductCategoryIcon(item.category);
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
        <div className="min-w-0">
          <DialogTitle
            className={cn(
              "min-w-0 break-words [overflow-wrap:anywhere] text-left text-2xl font-semibold leading-[1.12] tracking-tight sm:text-[1.75rem]",
              item.purchased && "line-through",
            )}
          >
            {item.title}
          </DialogTitle>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
            {item.price != null && item.price > 0 ? (
              <p className="mr-1 text-2xl font-semibold leading-none tabular-nums tracking-tight text-foreground sm:text-[1.85rem]">
                {formatPrice(item.price, item.currency, language)}
              </p>
            ) : null}
            <PriorityBadge priority={item.priority} className="text-[11px] opacity-85" />
          </div>
        </div>
      </DialogHeader>

      {item.user ? (
        <div className="flex min-w-0 items-center gap-2 border-y border-border/34 py-2.5 text-sm text-muted-foreground">
          <UserAvatar
            avatarUrl={item.user.avatarUrl || undefined}
            name={item.user.name}
            userId={item.user.id}
            size="sm"
          />
          <span className="truncate">{item.user.name}</span>
        </div>
      ) : null}

      {noteParagraphs?.length ? (
        <section className="max-w-[38rem] space-y-2.5 rounded-lg border border-border/34 bg-[hsl(var(--surface-3))/0.38] px-3.5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Описание")}
          </h3>
          <div
            className={cn(
              "space-y-2 text-sm leading-6 text-foreground/78 [text-wrap:pretty]",
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
              className="rounded-sm text-xs font-medium text-primary hover:text-primary/82 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setShowFullNotes((value) => !value)}
            >
              {showFullNotes ? t("Свернуть") : t("Показать полностью")}
            </button>
          ) : null}
        </section>
      ) : null}

      {item.category ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border/30 pt-3">
          <Badge variant="outline" className="gap-1.5 border-border/58 px-2 py-1 text-xs font-medium text-muted-foreground">
            <span aria-hidden>{categoryIcon}</span>
            {categoryLabel}
          </Badge>
        </div>
      ) : null}

      {(item.url || canManage) && (
        <div className="flex flex-wrap gap-2 border-t border-border/34 pt-4 sm:items-center">
          {item.url ? (
            <Button
              asChild
              className="h-11 min-h-[44px] min-w-[8.5rem] flex-1 basis-[8.5rem] shrink justify-center gap-2 px-3 sm:h-10 sm:min-h-10 sm:flex-none sm:basis-auto"
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
                  className={cn(actionButtonClass, "gap-2")}
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
        </div>
      )}
    </>
  );
}
