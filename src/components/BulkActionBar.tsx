"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, X, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uiSurface } from "@/lib/ui-contract";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMarkPurchased: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onMarkPurchased,
  onClearSelection,
  isProcessing,
}: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={uiSurface.floatingBar}>
            <div className="flex items-center gap-1.5 mr-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium tabular-nums">
                {selectedCount}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onMarkPurchased}
              disabled={isProcessing}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Куплено
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Удалить
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="ml-1 h-8 w-8"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
