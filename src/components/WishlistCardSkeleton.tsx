"use client";

/** Повторяет геометрию `WishCard`: фото 1:1 и три строки под ним. */
export function WishlistCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square w-full rounded-xl skeleton-shimmer" />
      <div className="space-y-2 pt-3">
        <div className="h-4 w-4/5 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        <div className="h-4 w-1/4 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
