"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

type RetryNoticeProps = {
  /** Что именно не удалось и что при этом осталось доступно. */
  children: ReactNode;
  /** Без обработчика полоса просто сообщает: не каждый отказ можно повторить. */
  onRetry?: () => void;
  className?: string;
};

/**
 * Полоса «не загрузилось, попробуйте ещё раз».
 *
 * Одна и та же строка из одиннадцати классов была выписана дословно в пяти
 * местах — на списке профилей дважды, в редакторе профиля, в календаре и в
 * статистике. Отличались только текст и обработчик.
 *
 * `role="alert"` здесь не украшение: полоса появляется асинхронно, уже после
 * того как страница отрисовалась, и без него смена состояния для скринридера
 * не происходит вовсе.
 */
export function RetryNotice({ children, onRetry, className }: RetryNoticeProps) {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-destructive/24 bg-destructive/5 px-4 py-3 text-sm",
        onRetry && "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="min-w-0">{children}</span>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onRetry}>
          {t("Повторить")}
        </Button>
      ) : null}
    </div>
  );
}
