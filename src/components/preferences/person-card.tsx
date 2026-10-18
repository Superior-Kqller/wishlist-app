"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";
import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { PreferenceHintChip } from "@/components/preferences/preference-hint-chip";
import { useI18n } from "@/components/i18n/language-provider";
import { getPreferenceHighlights } from "@/lib/preference-profiles";
import { getPreferenceColor } from "@/lib/preference-colors";
import { normalizeGiftPreferences, type GiftPreferences } from "@/lib/preferences";
import { easing } from "@/lib/motion";
import { uiState } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";

export type ProfileOccasion = { date: string; days: number };

/** Повод «скоро» — в пределах месяца: тогда у него точка `brand` и вес. */
export const OCCASION_SOON_DAYS = 30;

/** Ближайший день рождения словами: когда — отдельно, дата — отдельно. */
export function useOccasionParts() {
  const { t, locale } = useI18n();
  return (occasion: ProfileOccasion) => ({
    when:
      occasion.days === 0
        ? t("сегодня")
        : new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(occasion.days, "day"),
    date: new Date(`${occasion.date}T12:00:00`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    }),
  });
}

/** Любимые цвета рядом точек: «лицо» человека в цвете, без полосы-шапки. */
export function ColorDots({ colors, max = 6 }: { colors: string[]; max?: number }) {
  const { t } = useI18n();
  const known = colors.filter((name) => getPreferenceColor(name));
  if (known.length === 0) return null;
  const shown = known.slice(0, max);
  return (
    <span
      role="img"
      aria-label={`${t("Любимые цвета")}: ${known.map((name) => t(name)).join(", ")}`}
      className="flex items-center gap-1.5"
    >
      {shown.map((name) => (
        <PreferenceColorDot key={name} value={name} size="lg" />
      ))}
      {known.length > max ? (
        <span aria-hidden className="text-xs font-medium tabular-nums text-muted-foreground">
          +{known.length - max}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Сетка людей. Подложка наведения одна на всю сетку и переезжает к карточке
 * под курсором — Hover Effect (21st.dev, serafimcloud): общий `layoutId`,
 * появление 150ms, уход с задержкой 200ms, чтобы на переходе между
 * соседними карточками она не мигала. Переезд framer делает через `transform`.
 * Подложка — `surface-soft` (`accent`), без тени и свечения (DESIGN.md).
 */
export function PersonCardGrid<T extends { id: string }>({
  people,
  renderCard,
  className,
  stripRef,
  label,
}: {
  people: T[];
  renderCard: (person: T, index: number) => ReactNode;
  className?: string;
  stripRef?: React.Ref<HTMLDivElement>;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  // Подложка одна на сетку и ездит по измеренному прямоугольнику карточки;
  // `offset*` не зависят от `transform`, так что лесенка появления её не сбивает.
  const [plate, setPlate] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [active, setActive] = useState(false);
  const pad = 8;

  return (
    <div
      ref={stripRef}
      role="group"
      aria-label={label}
      className={cn("relative", className)}
      onPointerLeave={() => setActive(false)}
    >
      {plate && !reduceMotion ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 rounded-[1.25rem] bg-accent"
          initial={{
            opacity: 0,
            x: plate.x - pad,
            y: plate.y - pad,
            width: plate.w + pad * 2,
            height: plate.h + pad * 2,
          }}
          animate={{
            opacity: active ? 1 : 0,
            x: plate.x - pad,
            y: plate.y - pad,
            width: plate.w + pad * 2,
            height: plate.h + pad * 2,
          }}
          transition={{
            duration: 0.4,
            ease: easing.expo,
            opacity: { duration: 0.15, delay: active ? 0 : 0.2 },
          }}
        />
      ) : null}
      {people.map((person, index) => (
        // Карточки появляются лесенкой — Stagger Entrance (kinetics): 14px,
        // 450ms `expo`, шаг 90ms, не больше 8 шагов.
        <motion.div
          key={person.id}
          className="relative min-w-0"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easing.expo, delay: Math.min(index, 8) * 0.09 }}
          // Только мышь: тап на телефоне шлёт эмулированный enter без leave.
          onPointerEnter={(event) => {
            if (event.pointerType !== "mouse") return;
            const el = event.currentTarget;
            setPlate({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
            setActive(true);
          }}
        >
          {renderCard(person, index)}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Карточка человека — DESIGN.md → «Карточка человека»: холст, волосяная
 * рамка, радиус 14px, отступ 24px; аватар 64px, имя `title-md`, под ним
 * ближайший повод. Ниже — любимые цвета точками и три подсказки. Выбор —
 * рамкой 2px чернилами (второй пиксель внутренней тенью, без сдвига).
 */
export function PersonCard({
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
  const occasionParts = useOccasionParts();
  const preferences = normalizeGiftPreferences(rawPreferences);
  const highlights = getPreferenceHighlights(preferences);
  const likes = highlights.likes.filter((hint) => hint.kind !== "color").slice(0, 2);
  const avoid = highlights.avoid[0];
  const soon = !isCurrent && occasion && occasion.days <= OCCASION_SOON_DAYS;
  const parts = occasion ? occasionParts(occasion) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`profile-card-${id}`}
      className={cn(
        "relative flex h-full w-full min-w-0 flex-col gap-4 rounded-xl border bg-background p-6 text-left transition-[border-color,box-shadow] duration-fast",
        uiState.focusRing,
        selected
          ? "border-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]"
          : "border-border",
      )}
    >
      <span className="flex min-w-0 items-center gap-4">
        <UserAvatar
          avatarUrl={avatarUrl}
          name={name}
          userId={id}
          size="xl"
          className="size-16 shrink-0 text-xl"
        />
        <span className="min-w-0">
          <span className="block truncate text-lg font-semibold leading-tight tracking-[-0.01em]">
            {name}
          </span>
          <span
            className={cn(
              "mt-1 flex min-w-0 items-center gap-1.5 text-sm",
              soon ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {soon ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" /> : null}
            <span className="truncate">
              {isCurrent
                ? t("Это вы")
                : parts
                  ? soon
                    ? `${parts.when} · ${parts.date}`
                    : `${t("День рождения")} · ${parts.date}`
                  : t("Дата не указана")}
            </span>
          </span>
        </span>
      </span>

      <ColorDots colors={preferences.favoriteColors} />

      {likes.length > 0 || avoid ? (
        <span className="flex flex-wrap gap-1.5">
          {likes.map((hint) => (
            <PreferenceHintChip key={`${hint.kind}-${hint.value}`} hint={hint} />
          ))}
          {avoid ? <PreferenceHintChip hint={avoid} tone="avoid" /> : null}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">
          {isCurrent ? t("Расскажите о себе — кругу будет проще.") : t("Подсказок пока нет.")}
        </span>
      )}
    </button>
  );
}
