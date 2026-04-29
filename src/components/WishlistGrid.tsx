"use client";

import { WishlistItem } from "@/types";
import { WishCard } from "@/components/wishlist/wish-card";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { AnimatePresence } from "framer-motion";
import { AddItemCard } from "./AddItemCard";
import { Button } from "@/components/ui/button";
import { Inbox, RotateCcw } from "lucide-react";

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
      <section
        role="status"
        aria-live="polite"
        className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--surface-2))] px-4 py-10 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <Inbox className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          {emptyTitle ?? "Список пуст"}
        </h2>
        {emptyDescription ? (
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {emptyActionLabel && onEmptyAction ? (
            <Button type="button" onClick={onEmptyAction}>
              {emptyActionLabel}
            </Button>
          ) : null}
          {emptySecondaryLabel && onEmptySecondaryAction ? (
            <Button type="button" variant="outline" onClick={onEmptySecondaryAction}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {emptySecondaryLabel}
            </Button>
          ) : null}
        </div>
      </section>
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
      </AnimatePresence>
    </div>
  );
}
