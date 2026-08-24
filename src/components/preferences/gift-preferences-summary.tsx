"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  CircleDollarSign,
  Gift,
  Heart,
  Ruler,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PreferenceSignalRow,
  type PreferenceSignalRowProps,
} from "@/components/preferences/preference-signal-row";
import { useI18n } from "@/components/i18n/language-provider";
import { easing } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  countGiftPreferences,
  normalizeGiftPreferences,
  splitPreferenceList,
  type GiftPreferences,
} from "@/lib/preferences";
import { uiSurface } from "@/lib/ui-contract";

type GiftPreferencesSummaryProps = {
  /** Имя в заголовке «Что понравится …». Встроенному режиму не нужно: шапки у него нет. */
  userName?: string;
  preferences?: GiftPreferences | null;
  embedded?: boolean;
};

export function GiftPreferencesSummary({
  userName,
  preferences: rawPreferences,
  embedded = false,
}: GiftPreferencesSummaryProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  // `aria-expanded` без `aria-controls` ничего не связывает: у сворачиваемой
  // области не было id, и скринридер не знал, что именно раскрывает кнопка.
  const detailsId = useId();
  // Сворачивать можно только собственную шапку; встроенная сводка раскрыта
  // всегда, потому что её сворачивает сама карточка профиля.
  const [expanded, setExpanded] = useState(true);
  const preferences = normalizeGiftPreferences(rawPreferences);
  const preferenceCount = countGiftPreferences(preferences);
  const sizeItems = splitPreferenceList(preferences.sizes);
  const rowCompact = embedded;
  const rowLimit = embedded ? undefined : 3;
  const positiveRows: PreferenceSignalRowProps[] = [
    {
      icon: Heart,
      label: "Бренды",
      values: preferences.favoriteBrands,
      empty: "Бренды не указаны",
      limit: rowLimit,
    },
    {
      icon: Sparkles,
      label: "Цвета",
      values: preferences.favoriteColors,
      empty: "Цвета не выбраны",
      limit: rowLimit,
      colorDots: true,
    },
    {
      icon: Gift,
      label: "Категории",
      values: preferences.favoriteCategories,
      empty: "Категории не указаны",
      limit: rowLimit,
    },
    {
      icon: Heart,
      label: "Интересы",
      values: preferences.hobbies,
      empty: "Интересы не указаны",
      limit: rowLimit,
    },
    {
      icon: Sparkles,
      label: "Материалы",
      values: preferences.favoriteMaterials,
      empty: "Материалы не указаны",
      limit: rowLimit,
    },
  ];
  const avoidRows: PreferenceSignalRowProps[] = [
    {
      icon: ShieldAlert,
      label: "Бренды",
      values: preferences.dislikedBrands,
      empty: "Нет исключений",
      warning: true,
      limit: rowLimit,
    },
    {
      icon: ShieldAlert,
      label: "Цвета",
      values: preferences.dislikedColors,
      empty: "Нет исключений",
      warning: true,
      limit: rowLimit,
    },
    {
      icon: ShieldAlert,
      label: "Категории",
      values: preferences.dislikedCategories,
      empty: "Нет исключений",
      warning: true,
      limit: rowLimit,
    },
    {
      icon: ShieldAlert,
      label: "Материалы",
      values: preferences.dislikedMaterials,
      empty: "Нет исключений",
      warning: true,
      limit: rowLimit,
    },
    {
      icon: ShieldAlert,
      label: "Стоп-лист",
      values: preferences.doNotBuy,
      empty: "Стоп-лист пуст",
      warning: true,
      limit: rowLimit,
    },
  ];
  const detailRows: PreferenceSignalRowProps[] = [
    {
      icon: Ruler,
      label: "Размеры",
      values: sizeItems,
      empty: "Размеры не указаны",
      accent: "muted",
      limit: embedded ? undefined : 4,
    },
    {
      icon: CircleDollarSign,
      label: "Бюджет",
      values: preferences.budget ? [preferences.budget] : [],
      empty: "Бюджет не указан",
      accent: "muted",
    },
    {
      icon: Gift,
      label: "Поводы",
      values: preferences.occasions,
      empty: "Поводы не указаны",
      accent: "warning",
      limit: embedded ? undefined : 4,
    },
  ];
  const visiblePositiveRows = embedded
    ? positiveRows.filter((row) => row.values.length > 0)
    : positiveRows;
  const visibleAvoidRows = embedded ? avoidRows.filter((row) => row.values.length > 0) : avoidRows;
  const visibleDetailRows = embedded
    ? detailRows.filter((row) => row.values.length > 0)
    : detailRows;

  return (
    <section
      className={cn(
        "overflow-hidden",
        embedded
          ? "border-0 bg-transparent"
          : cn(
              uiSurface.contentPanel,
              "border-primary/24 bg-[linear-gradient(120deg,hsl(var(--surface-2)/0.85),hsl(var(--primary)/0.05))]",
            ),
      )}
      aria-label={t("Подарочный профиль")}
    >
      {!embedded ? (
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/24 bg-primary/10 text-primary-accent">
            <Gift className="h-5 w-5" aria-hidden />
          </div>
          {/* Надстрочная подпись «ПОДАРОЧНЫЙ ПРОФИЛЬ» убрана: она повторяла
              заголовок разрядкой в 11px и заставляла читать строку дважды.
              Заголовок несёт себя сам, а роль блока называет его `aria-label`. */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold sm:text-base">
              {t("Что понравится")} {userName}
            </h2>
          </div>
          {preferenceCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1.5 px-2 text-xs"
              aria-expanded={expanded}
              aria-controls={detailsId}
              aria-label={expanded ? t("Свернуть") : t("Показать")}
              onClick={() => setExpanded((current) => !current)}
            >
              <span className="hidden sm:inline">{expanded ? t("Свернуть") : t("Показать")}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </Button>
          ) : null}
        </div>
      ) : null}

      {preferenceCount === 0 ? (
        <div
          className={cn(
            "px-4 py-4 text-sm text-muted-foreground sm:px-5",
            !embedded && "border-t border-border/32",
          )}
        >
          {t("Пользователь пока не добавил подсказки для подарков.")}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {expanded || embedded ? (
            <motion.div
              id={detailsId}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: easing.expo }}
              className={cn(embedded ? "py-0.5" : "space-y-3 border-t border-border/32 p-3 sm:p-4")}
            >
              {/* Внутри карточки ширину задаёт не окно, а колонка сетки:
                  на широком экране в ряд встаёт три-четыре карточки, и
                  вьюпортный `md:` разбивал двадцатисантиметровую карточку
                  на две нечитаемые колонки. Контейнер объявлен карточкой. */}
              <div
                className={cn(
                  "grid gap-x-6 gap-y-5",
                  embedded ? "@[32rem]:grid-cols-2" : "xl:grid-cols-3",
                )}
              >
                {/* Три группы — разделы, а не абзацы. Раньше их подписи были
                    `<p>`, и после `h2` с именем человека структуры не было
                    вовсе: строки «Бренды», «Цвета», «Материалы» звучали дважды
                    подряд — в «Понравится» и в «Не подойдёт», — и различить их
                    было нечем. */}
                <section className="min-w-0" aria-labelledby={`${detailsId}-likes`}>
                  <h3
                    id={`${detailsId}-likes`}
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <Heart className="h-4 w-4 text-primary-accent" aria-hidden />
                    {t("Понравится")}
                  </h3>
                  {visiblePositiveRows.length > 0 ? (
                    visiblePositiveRows.map((row) => (
                      <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                    ))
                  ) : (
                    <p className="border-t border-border/32 py-3 text-sm text-muted-foreground">
                      {t("Любимые вещи пока не указаны")}
                    </p>
                  )}
                </section>
                <section
                  aria-labelledby={`${detailsId}-avoid`}
                  className={cn(
                    "min-w-0",
                    embedded
                      ? "@[32rem]:border-l @[32rem]:border-border/32 @[32rem]:pl-6"
                      : "md:border-l md:border-border/32 md:pl-6",
                  )}
                >
                  <h3
                    id={`${detailsId}-avoid`}
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />
                    {t("Не подойдёт")}
                  </h3>
                  {visibleAvoidRows.length > 0 ? (
                    visibleAvoidRows.map((row) => (
                      <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                    ))
                  ) : (
                    <p className="border-t border-border/32 py-3 text-sm text-muted-foreground">
                      {t("Ограничений пока нет")}
                    </p>
                  )}
                </section>
                <section
                  aria-labelledby={`${detailsId}-details`}
                  className={cn(
                    "min-w-0",
                    embedded && "border-t border-border/32 pt-5 @[32rem]:col-span-2",
                  )}
                >
                  <h3
                    id={`${detailsId}-details`}
                    className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"
                  >
                    <Ruler className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {t("Детали")}
                  </h3>
                  {visibleDetailRows.length > 0 ? (
                    <div className={cn(embedded && "grid gap-x-6 @[40rem]:grid-cols-3")}>
                      {visibleDetailRows.map((row) => (
                        <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                      ))}
                    </div>
                  ) : (
                    <p className="border-t border-border/32 py-3 text-sm text-muted-foreground">
                      {t("Размеры, бюджет и поводы пока не указаны")}
                    </p>
                  )}
                  {preferences.notes ? (
                    <p
                      className={cn(
                        "mt-3 min-w-0 whitespace-pre-wrap border-l-2 border-primary/32 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]",
                        embedded ? "pl-3" : "px-3 py-2",
                      )}
                    >
                      {preferences.notes}
                    </p>
                  ) : null}
                </section>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </section>
  );
}
