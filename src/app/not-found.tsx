"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/BrandLockup";
import { useI18n } from "@/components/i18n/language-provider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center page-bg px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl border border-border/58 bg-[hsl(var(--surface-2)/0.86)] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.44),inset_0_1px_0_hsl(var(--foreground)/0.05)] backdrop-blur-md sm:p-8">
        <BrandLockup className="justify-center" />
        <p className="mt-8 text-[5.5rem] font-semibold leading-none tracking-tight text-primary/80 sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{t("Страница не найдена")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {t("Проверьте ссылку или вернитесь к каталогу желаний.")}
        </p>
        <Button asChild className="mt-7 shadow-[var(--shadow-brand-action)]">
          <Link href="/">{t("На главную")}</Link>
        </Button>
      </section>
    </div>
  );
}
