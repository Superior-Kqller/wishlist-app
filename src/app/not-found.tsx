"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen page-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-semibold tracking-tight text-muted-foreground">
        404
      </h1>
      <p className="mt-2 text-muted-foreground">{t("Страница не найдена")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("На главную")}</Link>
      </Button>
    </div>
  );
}
