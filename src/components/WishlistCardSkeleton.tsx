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
      <Card className="overflow-hidden glass-card">
        <div className="aspect-[4/3] skeleton-shimmer" />
        <div className="p-3 space-y-2">
          <div className="h-4 rounded w-4/5 skeleton-shimmer" />
          <div className="h-3 rounded w-1/3 skeleton-shimmer" />
          <div className="flex gap-1">
            <div className="h-5 w-12 rounded skeleton-shimmer" />
            <div className="h-5 w-14 rounded skeleton-shimmer" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
