"use client";

import useSWR from "swr";
import packageJson from "../../package.json";
import { useI18n } from "@/components/i18n/language-provider";
import { fetcher } from "@/lib/fetcher";

/**
 * Версия берётся с сервера: в Docker-образе она приходит из `APP_VERSION`
 * и может отличаться от `package.json`, который остаётся запасным значением
 * до ответа API.
 */
export function Footer() {
  const { t } = useI18n();
  const { data } = useSWR<{ version: string }>("/api/version", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return (
    <footer className="border-t border-border/45 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-center text-xs text-muted-foreground/65 sm:pb-4">
      {t("Вишлист")}&nbsp;·&nbsp;v{data?.version ?? packageJson.version}
    </footer>
  );
}
