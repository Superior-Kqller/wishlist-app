"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Используем sanitizeError для безопасного логирования
    // В production ошибки не должны содержать чувствительные данные
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight">{t("Что-то пошло не так")}</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        {t("Произошла ошибка. Попробуйте обновить страницу.")}
      </p>
      <Button onClick={reset} className="mt-6">
        {t("Попробовать снова")}
      </Button>
    </div>
  );
}
