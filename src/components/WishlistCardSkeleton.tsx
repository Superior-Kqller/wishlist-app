"use client";

import { Card } from "@/components/ui/card";

export function WishlistCardSkeleton() {
  return (
    <div>
      <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-[hsl(var(--surface-2))] elevation-interactive-card">
        <div className="min-h-[178px] flex-1 basis-[178px] skeleton-shimmer sm:min-h-[196px] sm:basis-[196px] 2xl:min-h-[210px] 2xl:basis-[210px]" />
        <div className="space-y-2 p-3 pb-2 sm:p-3.5 sm:pb-2.5">
          <div className="h-4 w-4/5 rounded skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded skeleton-shimmer" />
          <div className="flex gap-1">
            <div className="h-6 w-16 rounded skeleton-shimmer" />
            <div className="h-6 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="mt-auto flex min-h-[3.5rem] items-center justify-between gap-2 border-t border-border/16 bg-[hsl(var(--surface-1)/0.24)] p-2.5 sm:min-h-[3.75rem] sm:p-3">
          <div className="h-5 w-20 rounded skeleton-shimmer" />
          <div className="h-10 w-28 rounded skeleton-shimmer" />
        </div>
      </Card>
    </div>
  );
}
