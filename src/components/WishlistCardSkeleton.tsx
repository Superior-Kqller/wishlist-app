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
      <Card className="overflow-hidden card-elevated">
        <div className="aspect-[4/3] bg-muted animate-pulse" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
          <div className="flex gap-1">
            <div className="h-5 w-12 bg-muted rounded animate-pulse" />
            <div className="h-5 w-14 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
