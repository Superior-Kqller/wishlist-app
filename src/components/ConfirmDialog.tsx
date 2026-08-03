"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  /**
   * Может вернуть промис. Диалог закроется только после успешного резолва;
   * при отказе он остаётся открытым и показывает причину рядом с кнопкой,
   * потому что закрытое окно читается пользователем как «получилось».
   */
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveConfirmLabel = confirmLabel ?? t("Подтвердить");
  const effectiveCancelLabel = cancelLabel ?? t("Отмена");

  useEffect(() => {
    if (!open) {
      setPending(false);
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Не удалось выполнить действие"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
          >
            {error}
          </p>
        ) : null}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {effectiveCancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {error ? t("Повторить") : effectiveConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
