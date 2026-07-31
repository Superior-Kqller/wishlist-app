"use client";

import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, X, CheckSquare } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

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
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={
            reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 300, damping: 30 }
          }
          className="fixed inset-x-3 bottom-[calc(4.9rem+env(safe-area-inset-bottom,0px))] z-50 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2"
        >
          <div
            className={`${uiSurface.floatingBar} mx-auto w-full max-w-md justify-between sm:w-auto sm:max-w-none`}
          >
            <div className="mr-1 flex min-w-0 items-center gap-1.5 sm:mr-2">
              <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm font-medium tabular-nums" aria-live="polite">
                {selectedCount}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onMarkPurchased}
              disabled={isProcessing}
              className="h-10 flex-1 px-3 sm:flex-none"
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {t("Куплено")}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isProcessing}
              className="h-10 flex-1 px-3 sm:flex-none"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {t("Удалить")}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="ml-1 h-10 w-10 shrink-0"
              onClick={onClearSelection}
              disabled={isProcessing}
              aria-label={t("Отменить выбор")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
