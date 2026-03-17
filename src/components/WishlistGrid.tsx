"use client";

import { WishlistItem } from "@/types";
import { WishlistCard } from "./WishlistCard";
import { WishlistCardSkeleton } from "./WishlistCardSkeleton";
import { AnimatePresence, motion } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WishlistGridProps {
  items: WishlistItem[];
  isLoading?: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onEmptyAdd?: () => void;
  onOpenDetail?: (item: WishlistItem) => void;
}

export function WishlistGrid({
  items,
  isLoading,
  onEdit,
  onDelete,
  onTogglePurchased,
  onEmptyAdd,
  onOpenDetail,
}: WishlistGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <WishlistCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gift className="w-12 h-12 text-primary/70" />
          </motion.div>
        </motion.div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">
          Добавьте первое желание
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          Нажмите кнопку ниже или добавьте товар из ссылки
        </p>
        {onEmptyAdd && (
          <Button onClick={onEmptyAdd} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Добавить желание
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <WishlistCard
            key={item.id}
            item={item}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePurchased={onTogglePurchased}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
