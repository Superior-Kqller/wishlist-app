"use client";

import { WishlistItem } from "@/types";
import { WishCard } from "@/components/wishlist/wish-card";
import { ProductRow } from "@/components/wishlist/product-row";
import type { WishlistViewMode } from "@/components/wishlist/wishlist-view-toggle";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { AddItemCard } from "./AddItemCard";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { getItemWord } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { duration, easing } from "@/lib/motion";
import type { ItemStatus } from "@/lib/item-status";

const catalogGridClassName =
  "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 min-[1600px]:grid-cols-5 min-[2200px]:grid-cols-6";

interface WishlistGridProps {
  items: WishlistItem[];
  isLoading?: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  pendingStatusByItemId?: Record<string, boolean>;
  /** Товар, только что отмеченный купленным: получает подтверждающую анимацию. */
  justPurchasedId?: string | null;
  onEmptyAdd?: () => void;
  emptyAddDisabled?: boolean;
  emptyAddDisabledHint?: string;
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
 * `initial={false}` важен: карточки, уже лежащие на странице при первой
 * отрисовке, не анимируются. Хореографии загрузки в продукте нет — движение
 * возникает только в ответ на действие человека.
 */
export function WishlistGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onSetStatus,
  pendingStatusByItemId,
  justPurchasedId,
  onEmptyAdd,
  emptyAddDisabled,
  emptyAddDisabledHint,
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

  if (viewMode === "table") {
    return (
      <div
        role="region"
        aria-label={t("Таблица желаний")}
        className={cn(uiSurface.contentPanel, "overflow-hidden")}
      >
        <p aria-live="polite" className="sr-only">
          {items.length} {getItemWord(language, items.length)}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Товар")}</TableHead>
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
        {items.length} {getItemWord(language, items.length)}
      </p>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={reduceMotion ? false : "position"}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            // Уход быстрее прихода: список должен сомкнуться сразу, а не
            // ждать, пока отфильтрованное доиграет.
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{
              layout: { duration: duration.slow, ease: easing.expo },
              duration: duration.base,
              ease: easing.expo,
            }}
            className="h-full"
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
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {onEmptyAdd && (
        <AddItemCard
          key="add-item-card"
          onAdd={onEmptyAdd}
          disabled={emptyAddDisabled}
          disabledHint={emptyAddDisabledHint}
        />
      )}
    </div>
  );
}
