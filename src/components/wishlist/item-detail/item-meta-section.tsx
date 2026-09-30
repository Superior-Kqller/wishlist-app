"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, ShoppingCart, Trash2, Undo2 } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

type ItemActionProps = {
  item: WishlistItem;
  canManage: boolean;
  statusPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePurchased: () => void;
};

/** Название и чьё это желание — шапка левой колонки (DESIGN.md → display-lg). */
export function ItemDetailHeader({ item }: { item: WishlistItem }) {
  const { language } = useI18n();
  const categoryLabel = getProductCategoryLabel(item.category, language);

  return (
    <header className="space-y-2 pr-10">
      <DialogTitle
        className={cn(
          "min-w-0 break-words text-[1.375rem] font-semibold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere]",
          isItemPurchased(item) && "line-through decoration-muted-foreground/55",
        )}
      >
        {item.title}
      </DialogTitle>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {item.user ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground">
            <UserAvatar
              avatarUrl={item.user.avatarUrl || undefined}
              name={item.user.name}
              userId={item.user.id}
              size="sm"
            />
            <span className="truncate">{item.user.name}</span>
          </span>
        ) : null}
        {item.user && item.category ? <span aria-hidden>·</span> : null}
        {item.category ? <span className="truncate">{categoryLabel}</span> : null}
        {/* На телефоне карточки фактов нет — важность встаёт в эту строку. */}
        <PriorityBadgeInline priority={item.priority} className="md:hidden" />
      </div>
    </header>
  );
}

/** Описание с раскрытием длинного текста. */
export function ItemDetailNotes({ item }: { item: WishlistItem }) {
  const { t } = useI18n();
  const [showFullNotes, setShowFullNotes] = useState(false);
  const hasLongNotes = Boolean(item.notes && item.notes.length > 280);
  const noteParagraphs = item.notes
    ?.split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  useEffect(() => {
    setShowFullNotes(false);
  }, [item.id]);

  if (!noteParagraphs?.length) return null;

  return (
    <section className="space-y-3" aria-labelledby={`notes-${item.id}`}>
      <h3 id={`notes-${item.id}`} className="text-xl font-semibold tracking-[-0.01em]">
        {t("Описание")}
      </h3>
      <div
        className={cn(
          "max-w-[65ch] space-y-3 text-base leading-relaxed text-[hsl(var(--foreground)/0.85)] [text-wrap:pretty]",
          hasLongNotes && !showFullNotes && "line-clamp-6",
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
          className="rounded-sm text-sm font-semibold text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setShowFullNotes((value) => !value)}
        >
          {showFullNotes ? t("Свернуть") : t("Показать полностью")}
        </button>
      ) : null}
    </section>
  );
}

function StatusBadge({ item }: { item: WishlistItem }) {
  const { t } = useI18n();
  const isBought = isItemPurchased(item);
  return (
    <Badge variant={isBought ? "success" : "info"} className="gap-1.5">
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {isBought ? t("Уже куплено") : t("Ещё не куплено")}
    </Badge>
  );
}

/**
 * Липкая карточка действий справа (DESIGN.md → reservation-card): цена, факты
 * о желании, одно главное действие, ниже — действия владельца.
 */
export function ItemActionCard({
  item,
  canManage,
  statusPending,
  onEdit,
  onDelete,
  onTogglePurchased,
}: ItemActionProps) {
  const { language, t } = useI18n();
  const isBought = isItemPurchased(item);
  const hasPrice = item.price != null && item.price > 0;
  const facts: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: t("Приоритет"),
      value: <PriorityBadgeInline priority={item.priority} className="text-foreground" />,
    },
    ...(item.category
      ? [
          {
            label: t("Категория"),
            value: (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <ProductCategoryIcon category={item.category} className="size-4 shrink-0" />
                <span className="truncate">{getProductCategoryLabel(item.category, language)}</span>
              </span>
            ),
          },
        ]
      : []),
    { label: t("Статус"), value: <StatusBadge item={item} /> },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-float)]">
      {hasPrice ? (
        <p className="text-[1.3125rem] font-bold leading-tight tabular-nums">
          {formatPrice(item.price!, item.currency, language)}
          <span className="sr-only"> — {t("Ориентировочная стоимость").toLowerCase()}</span>
        </p>
      ) : null}

      <dl className={cn("divide-y divide-border text-sm", hasPrice && "mt-4")}>
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="shrink-0 text-muted-foreground">{fact.label}</dt>
            <dd className="flex min-w-0 justify-end">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {canManage ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-4 h-12 w-full gap-2"
          onClick={onTogglePurchased}
          disabled={statusPending}
        >
          {isBought ? <Undo2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          {isBought ? t("Снять отметку") : t("Отметить купленным")}
        </Button>
      ) : null}

      {item.url ? (
        <Button asChild size="lg" className={cn("w-full gap-2", canManage ? "mt-2" : "mt-4")}>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 shrink-0" />
            {t("Открыть ссылку")}
          </a>
        </Button>
      ) : null}

      {canManage ? (
        <div className="mt-4 flex items-center justify-center gap-1 border-t border-border pt-3">
          <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t("Редактировать")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            {t("Удалить")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Нижняя липкая панель на телефоне (DESIGN.md → «Адаптив»): цена и статус
 * слева, главное действие справа, действия владельца — в меню.
 */
export function ItemDetailDock({
  item,
  canManage,
  statusPending,
  onEdit,
  onDelete,
  onTogglePurchased,
}: ItemActionProps) {
  const { language, t } = useI18n();
  const isBought = isItemPurchased(item);
  const hasPrice = item.price != null && item.price > 0;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        {hasPrice ? (
          <p className="truncate text-lg font-bold leading-tight tabular-nums">
            {formatPrice(item.price!, item.currency, language)}
          </p>
        ) : null}
        <p
          className={cn(
            "truncate text-xs font-medium",
            isBought ? "text-success" : "text-muted-foreground",
          )}
        >
          {isBought ? t("Уже куплено") : t("Ещё не куплено")}
        </p>
      </div>

      {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0"
              aria-label={t("Действия")}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
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

      {item.url ? (
        <Button asChild className="h-12 shrink-0 gap-2 px-5">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 shrink-0" />
            {t("Открыть ссылку")}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
