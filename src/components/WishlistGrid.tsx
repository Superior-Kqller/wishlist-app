"use client";

import { WishlistItem } from "@/types";
import { WishCard } from "@/components/wishlist/wish-card";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { AnimatePresence } from "framer-motion";
import { AddItemCard } from "./AddItemCard";

interface WishlistGridProps {
  items: WishlistItem[];
  isLoading?: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => void;
  pendingStatusByItemId?: Record<string, boolean>;
  onEmptyAdd?: () => void;
  emptyAddDisabled?: boolean;
  emptyAddDisabledHint?: string;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
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
}: WishlistGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <WishlistCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`Список желаний: ${items.length} ${items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}`}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <WishCard
            key={item.id}
            item={item}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePurchased={onTogglePurchased}
            onSetStatus={onSetStatus}
            statusPending={!!pendingStatusByItemId?.[item.id]}
            onOpenDetail={onOpenDetail}
            selectionMode={selectionMode}
            isSelected={selectedIds?.has(item.id)}
            onToggleSelect={onToggleSelect}
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
      </AnimatePresence>
    </div>
  );
}
