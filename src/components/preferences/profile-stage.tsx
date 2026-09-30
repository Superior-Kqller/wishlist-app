"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Pencil } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import { PaletteBand } from "@/components/preferences/palette-band";
import {
  useOccasionLabel,
  type ProfileOccasion,
} from "@/components/preferences/profile-swatch-card";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { normalizeGiftPreferences, type GiftPreferences } from "@/lib/preferences";

/**
 * Сцена выбранного человека — липкая карточка по DESIGN.md (как карточка
 * действий в окне желания): палитра с подписанными цветами, лицо и имя,
 * одно главное действие — уйти в его список желаний, ниже полная сводка.
 * Для своего профиля главное действие — настроить его.
 */
export function ProfileStage({
  id,
  name,
  username,
  avatarUrl,
  preferences: rawPreferences,
  wishCount,
  occasion,
  isCurrent,
  hasDraft,
}: {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  preferences?: GiftPreferences | null;
  wishCount?: number;
  occasion?: ProfileOccasion;
  isCurrent: boolean;
  hasDraft: boolean;
}) {
  const { t, language } = useI18n();
  const occasionLabel = useOccasionLabel();
  const preferences = normalizeGiftPreferences(rawPreferences);
  const headingId = `profile-stage-${id}`;
  // Раскладка палитры отвечает на смену человека, не на загрузку страницы.
  const [firstShownId] = useState(id);

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-float)]"
    >
      <div key={id}>
        <PaletteBand
          userId={id}
          colors={preferences.favoriteColors}
          labelled
          animate={id !== firstShownId}
          className="h-24"
        />

        <div className="px-6 pb-6">
          <UserAvatar
            avatarUrl={avatarUrl}
            name={name}
            userId={id}
            size="xl"
            className="relative z-10 -mt-8 size-16 text-xl ring-4 ring-card"
          />
          <div className="mt-3 flex min-w-0 items-center gap-2">
            <h2
              id={headingId}
              className="min-w-0 truncate text-[1.375rem] font-semibold leading-tight tracking-[-0.02em]"
            >
              {name}
            </h2>
            {isCurrent && hasDraft ? <Badge variant="warning">{t("Черновик")}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            @{username}
            {typeof wishCount === "number"
              ? ` · ${wishCount} ${getWishWord(language, wishCount)}`
              : null}
            {occasion && !isCurrent ? ` · ${occasionLabel(occasion)}` : null}
          </p>

          {isCurrent ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button asChild variant="secondary" className="h-12">
                <Link href="/preferences/me">
                  <Pencil className="h-4 w-4" aria-hidden />
                  {hasDraft ? t("Продолжить заполнение") : t("Настроить профиль")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12">
                <Link href="/?userId=me">
                  <Gift className="h-4 w-4" aria-hidden />
                  {t("Мой список")}
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="mt-5 w-full">
              <Link href={`/?userId=${id}`}>
                <Gift className="h-4 w-4" aria-hidden />
                {t("Открыть список желаний")}
              </Link>
            </Button>
          )}
        </div>

        <div className="@container border-t border-border px-6 py-6">
          <GiftPreferencesSummary preferences={preferences} embedded isOwn={isCurrent} />
        </div>
      </div>
    </section>
  );
}
