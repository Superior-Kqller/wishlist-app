"use client";

import { WishlistItem } from "@/types";
import { WishCard } from "@/components/wishlist/wish-card";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { AddItemCard } from "./AddItemCard";
import { EmptyState } from "@/components/ui/empty-state";
import { RotateCcw } from "lucide-react";

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
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
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
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptySecondaryLabel,
  onEmptySecondaryAction,
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

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? "Список пуст"}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        secondaryLabel={emptySecondaryLabel}
        onSecondaryAction={onEmptySecondaryAction}
        secondaryIcon={<RotateCcw className="h-4 w-4" />}
      />
    );
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`Список желаний: ${items.length} ${items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}`}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
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
