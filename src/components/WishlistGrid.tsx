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
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { getItemWord } from "@/lib/i18n";

interface WishlistGridProps {
  items: WishlistItem[];
  isLoading?: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "PURCHASED") => void;
  pendingStatusByItemId?: Record<string, boolean>;
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

export function WishlistGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onTogglePurchased,
  onSetStatus,
  pendingStatusByItemId,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <WishlistCardSkeleton key={i} index={i} />
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

  if (viewMode === "table") {
    return (
      <div
        role="region"
        aria-live="polite"
        aria-label={`${t("Таблица желаний")}: ${items.length} ${getItemWord(language, items.length)}`}
        className={cn(uiSurface.contentPanel, "overflow-hidden")}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Товар")}</TableHead>
              <TableHead>{t("Владелец")}</TableHead>
              <TableHead className="text-right">{t("Ориентировочная стоимость")}</TableHead>
              <TableHead>{t("Категория")}</TableHead>
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
                onTogglePurchased={onTogglePurchased}
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
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`${t("Список желаний")}: ${items.length} ${getItemWord(language, items.length)}`}
      className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {items.map((item) => (
        <WishCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePurchased={onTogglePurchased}
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
