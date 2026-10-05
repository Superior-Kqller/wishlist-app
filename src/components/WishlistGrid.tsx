"use client";

import { WishlistItem } from "@/types";
import { WishCard } from "@/components/wishlist/wish-card";
import { ProductRow } from "@/components/wishlist/product-row";
import { WishListRow } from "@/components/wishlist/wish-list-row";
import { useMediaQuery } from "@/lib/use-media-query";
import type { WishlistViewMode } from "@/components/wishlist/wishlist-view-toggle";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { duration, easing } from "@/lib/motion";
import type { ItemStatus } from "@/lib/item-status";

const catalogGridClassName =
  "grid grid-cols-2 gap-x-4 gap-y-8 min-[744px]:grid-cols-3 min-[1128px]:grid-cols-4";

interface WishlistGridProps {
  items: WishlistItem[];
  isLoading?: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  pendingStatusByItemId?: Record<string, boolean>;
  /** Товар, только что отмеченный купленным: получает подтверждающую анимацию. */
  justPurchasedId?: string | null;
  /** Выбран один человек: его имя на каждой карточке ничего не добавляет. */
  hideOwner?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  viewMode?: WishlistViewMode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptySecondaryLabel?: string;
  onEmptySecondaryAction?: () => void;
}

/*
 * Единственное авторское движение продукта — то, что происходит со списком.
 *
 * Поиск, фильтр, охват и сортировка меняют выдачу молча: карточки просто
 * подменялись, и понять, что именно случилось, было нельзя. Теперь смена
 * читается как перестроение: уцелевшие желания едут на новые места, ушедшие
 * уходят, пришедшие появляются. Это не украшение — это единственный ответ на
 * вопрос «что сделал мой фильтр».
 *
 * Появление — Stagger Entrance (kinetics.colorion.co): карточки поднимаются
 * на 14px по очереди с шагом 90ms, 0.45s по кривой `expo`. Шаг ограничен
 * восемью карточками, чтобы дальние не ждали; уход — сразу, без задержки.
 */
export function WishlistGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onSetStatus,
  pendingStatusByItemId,
  justPurchasedId,
  hideOwner,
  onOpenDetail,
  selectionMode,
  selectedIds,
  onToggleSelect,
  currentUserId,
  currentUserRole,
  viewMode = "grid",
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptySecondaryLabel,
  onEmptySecondaryAction,
}: WishlistGridProps) {
  const { language, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const isPhone = useMediaQuery("(max-width: 639px)");

  if (isLoading) {
    return (
      <div className={catalogGridClassName}>
        {Array.from({ length: 12 }).map((_, i) => (
          <WishlistCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("Список пуст")}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        secondaryLabel={emptySecondaryLabel}
        onSecondaryAction={onEmptySecondaryAction}
        secondaryIcon={<RotateCcw className="h-4 w-4" />}
      />
    );
  }

  /*
   * Пустая колонка — это не «нет данных», а лишний столбец: одиннадцать строк
   * с прочерком в «Категории» и одинаковыми пустыми квадратами превью читались
   * как незаполненная таблица, хотя заполнять там нечего.
   */
  const showPreviewColumn = items.some((item) => Boolean(item.images?.[0]));
  const showCategoryColumn = items.some((item) => Boolean(item.category));

  /*
   * На телефоне «список» — строки, а не таблица: пять столбцов на 390px
   * уезжали в горизонтальную прокрутку. Строки лежат в одной поверхности,
   * разделённые линией, а не стопкой отдельных карточек.
   */
  if (viewMode === "table" && isPhone) {
    return (
      <div
        role="region"
        aria-label={t("Список желаний")}
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <p aria-live="polite" className="sr-only">
          {items.length} {getWishWord(language, items.length)}
        </p>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <WishListRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetStatus={onSetStatus}
              statusPending={!!pendingStatusByItemId?.[item.id]}
              onOpenDetail={onOpenDetail}
              selectionMode={selectionMode}
              isSelected={selectedIds?.has(item.id)}
              onToggleSelect={onToggleSelect}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          ))}
        </ul>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <div
        role="region"
        aria-label={t("Таблица желаний")}
        className={cn(uiSurface.contentPanel, "overflow-hidden")}
      >
        <p aria-live="polite" className="sr-only">
          {items.length} {getWishWord(language, items.length)}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Желание")}</TableHead>
              <TableHead>{t("Владелец")}</TableHead>
              <TableHead className="text-right">{t("Ориентировочная стоимость")}</TableHead>
              {showCategoryColumn ? <TableHead>{t("Категория")}</TableHead> : null}
              <TableHead className="text-right">{t("Действия")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <ProductRow
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetStatus={onSetStatus}
                statusPending={!!pendingStatusByItemId?.[item.id]}
                onOpenDetail={onOpenDetail}
                selectionMode={selectionMode}
                isSelected={selectedIds?.has(item.id)}
                onToggleSelect={onToggleSelect}
                showPreviewColumn={showPreviewColumn}
                showCategoryColumn={showCategoryColumn}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={t("Список желаний")}
      // `items-start`, а не `stretch`: желания со снимком и без него имеют
      // разную высоту по делу, и растяжка переносила эту разницу внутрь
      // карточки — пустота между строкой фактов и ценой читалась как
      // потерянное содержимое. Теперь карточка ровно такой высоты, сколько
      // в ней есть.
      className={cn(catalogGridClassName, "items-start")}
    >
      <p aria-live="polite" className="sr-only">
        {items.length} {getWishWord(language, items.length)}
      </p>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout={reduceMotion ? false : "position"}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            // Уход быстрее прихода: список должен сомкнуться сразу, а не
            // ждать, пока отфильтрованное доиграет.
            exit={{ opacity: 0, transition: { duration: duration.base, delay: 0 } }}
            transition={{
              layout: { duration: duration.slow, ease: easing.expo },
              duration: 0.45,
              ease: easing.expo,
              delay: Math.min(index, 8) * 0.09,
            }}
            className="min-w-0"
          >
            <WishCard
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetStatus={onSetStatus}
              statusPending={!!pendingStatusByItemId?.[item.id]}
              justPurchased={justPurchasedId === item.id}
              onOpenDetail={onOpenDetail}
              selectionMode={selectionMode}
              isSelected={selectedIds?.has(item.id)}
              onToggleSelect={onToggleSelect}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              hideOwner={hideOwner}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
