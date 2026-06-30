"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface WishlistCardSkeletonProps {
  index?: number;
}

export function WishlistCardSkeleton({ index = 0 }: WishlistCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card className="flex h-full flex-col overflow-hidden border-border/65 bg-[hsl(var(--surface-2))] elevation-interactive-card">
        <div className="min-h-[178px] flex-1 basis-[178px] skeleton-shimmer sm:min-h-[190px] sm:basis-[190px]" />
        <div className="relative z-10 mx-1.5 -mt-3 space-y-2 rounded-t-[1.1rem] border border-border/24 border-b-0 bg-[hsl(var(--surface-2))/0.94] p-3 pb-2 sm:mx-2 sm:-mt-4 sm:p-3.5 sm:pb-2.5">
          <div className="h-4 w-4/5 rounded skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded skeleton-shimmer" />
          <div className="flex gap-1">
            <div className="h-5 w-12 rounded skeleton-shimmer" />
            <div className="h-5 w-14 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="mx-1.5 mb-1.5 flex min-h-[3.75rem] items-center justify-between gap-2 rounded-b-[1.1rem] border border-border/24 border-t-border/18 bg-[hsl(var(--surface-2))/0.94] p-2.5 pt-2 sm:mx-2 sm:mb-2 sm:min-h-16 sm:p-3 sm:pt-2.5">
          <div className="h-5 w-20 rounded skeleton-shimmer" />
          <div className="h-10 w-28 rounded skeleton-shimmer" />
        </div>
      </Card>
    </motion.div>
  );
}
