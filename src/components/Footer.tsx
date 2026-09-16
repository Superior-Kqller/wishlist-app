"use client";

import packageJson from "../../package.json";
import { useI18n } from "@/components/i18n/language-provider";

export function Footer() {
  const { t } = useI18n();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version;

  return (
    <footer className="border-t border-border/45 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-center text-xs text-muted-foreground-subtle sm:pb-4">
      {t("Вишлист")}&nbsp;·&nbsp;v{version}
    </footer>
  );
}
