"use client";

import { useEffect, useRef } from "react";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/ProfileForm";
import { useI18n } from "@/components/i18n/language-provider";

/**
 * Закладка «В вишлист»: на странице товара открывает в новой вкладке форму
 * добавления с этой ссылкой (`/?addUrl=…&fill=1`).
 */
export function BookmarkletSection() {
  const { t } = useI18n();
  const linkRef = useRef<HTMLAnchorElement>(null);

  // React 19 заменяет `javascript:` в href заглушкой, поэтому адрес ставим мимо него.
  useEffect(() => {
    const target = `${window.location.origin}/?fill=1&addUrl=`;
    linkRef.current?.setAttribute(
      "href",
      `javascript:void window.open('${target}'+encodeURIComponent(location.href))`,
    );
  }, []);

  return (
    <SettingsSection
      title={t("Кнопка «В вишлист»")}
      description={t(
        "Перетащите кнопку на панель закладок. На странице товара нажмите закладку — откроется форма с заполненными полями.",
      )}
    >
      <Button asChild variant="outline" className="cursor-grab">
        <a ref={linkRef} onClick={(e) => e.preventDefault()}>
          <BookmarkPlus className="h-4 w-4" aria-hidden />
          {t("В вишлист")}
        </a>
      </Button>
    </SettingsSection>
  );
}
