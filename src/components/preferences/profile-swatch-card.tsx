"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { PaletteBand } from "@/components/preferences/palette-band";
import { PreferenceHintChip } from "@/components/preferences/preference-hint-chip";
import { useI18n } from "@/components/i18n/language-provider";
import { getPreferenceHighlights } from "@/lib/preference-profiles";
import { normalizeGiftPreferences, type GiftPreferences } from "@/lib/preferences";
import { uiState } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";

export type ProfileOccasion = { date: string; days: number };

/** Ближайший день рождения словами: «через 5 дней · 12 окт.». */
export function useOccasionLabel() {
  const { t, locale } = useI18n();
  return (occasion: ProfileOccasion) => {
    const date = new Date(`${occasion.date}T12:00:00`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
    const when =
      occasion.days === 0
        ? t("сегодня")
        : new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(occasion.days, "day");
    return `${t("День рождения")} ${when} · ${date}`;
  };
}

/**
 * Карточка человека в круге — по DESIGN.md → «Карточка человека», в форме
 * «объявления»: палитра его любимых цветов вместо фото (плитка 14px без рамки
 * у карточки), аватар на её кромке, имя, ближайший повод и три подсказки.
 * Выбор — кольцо чернилами вокруг палитры, как у карточки желания. Это выбор,
 * а не анкета: полный профиль читается в сцене рядом.
 */
export function ProfileSwatchCard({
  id,
  name,
  avatarUrl,
  preferences: rawPreferences,
  occasion,
  isCurrent,
  selected,
  onSelect,
}: {
  id: string;
  name: string;
  avatarUrl?: string | null;
  preferences?: GiftPreferences | null;
  occasion?: ProfileOccasion;
  isCurrent: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const occasionLabel = useOccasionLabel();
  const preferences = normalizeGiftPreferences(rawPreferences);
  const highlights = getPreferenceHighlights(preferences);
  const likes = highlights.likes.filter((hint) => hint.kind !== "color").slice(0, 3);
  const avoid = highlights.avoid[0];
  const soon = !isCurrent && occasion && occasion.days <= 30;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`profile-swatch-${id}`}
      className={cn("group flex min-w-0 flex-col rounded-xl text-left", uiState.focusRing)}
    >
      <div className="relative">
        <div
          className={cn(
            "overflow-hidden rounded-xl transition-shadow duration-[var(--dur-base)]",
            selected
              ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
              : "group-hover:shadow-[var(--shadow-float)]",
          )}
        >
          <PaletteBand userId={id} colors={preferences.favoriteColors} className="h-24" />
        </div>
        <UserAvatar
          avatarUrl={avatarUrl}
          name={name}
          userId={id}
          size="xl"
          className="absolute -bottom-7 left-4 size-14 text-lg ring-4 ring-background"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 px-1 pt-9">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{name}</h3>
          <p
            className={cn(
              "flex min-w-0 items-center gap-1.5 text-sm",
              soon ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {soon ? <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden /> : null}
            <span className="truncate">
              {isCurrent ? t("Это вы") : occasion ? occasionLabel(occasion) : t("Дата не указана")}
            </span>
          </p>
        </div>

        {likes.length > 0 || avoid ? (
          <div className="flex flex-wrap gap-1.5">
            {likes.map((hint) => (
              <PreferenceHintChip key={`${hint.kind}-${hint.value}`} hint={hint} />
            ))}
            {avoid ? <PreferenceHintChip hint={avoid} tone="avoid" /> : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isCurrent ? t("Расскажите о себе — кругу будет проще.") : t("Подсказок пока нет.")}
          </p>
        )}
      </div>
    </button>
  );
}
