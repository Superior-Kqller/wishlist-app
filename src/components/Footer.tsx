"use client";

import packageJson from "../../package.json";
import { useI18n } from "@/components/i18n/language-provider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/45 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-center text-xs text-muted-foreground/65 sm:pb-4 lg:hidden">
      {t("Вишлист")}&nbsp;·&nbsp;v{packageJson.version}
    </footer>
  );
}
