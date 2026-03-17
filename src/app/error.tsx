"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Используем sanitizeError для безопасного логирования
    // В production ошибки не должны содержать чувствительные данные
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Произошла ошибка. Попробуйте обновить страницу.
      </p>
      <Button onClick={reset} className="mt-6">
        Попробовать снова
      </Button>
    </div>
  );
}
