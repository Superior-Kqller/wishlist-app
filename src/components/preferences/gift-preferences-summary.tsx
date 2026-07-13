"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  countGiftPreferences,
  normalizeGiftPreferences,
  splitPreferenceList,
  type GiftPreferences,
} from "@/lib/preferences";
import { uiSurface } from "@/lib/ui-contract";

type GiftPreferencesSummaryProps = {
  userName: string;
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

  return (
    <section
      className={cn(
        "overflow-hidden",
        embedded
          ? "border-0 bg-transparent"
          : cn(
              uiSurface.contentPanel,
              "border-primary/20 bg-[linear-gradient(120deg,hsl(var(--surface-2)/0.9),hsl(var(--primary)/0.055))]",
            ),
      )}
      aria-label={t("Подарочный профиль")}
    >
      {!embedded ? (
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/22 bg-primary/10 text-primary">
            <Gift className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-primary/80">
              {t("Подарочный профиль")}
            </p>
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
              onClick={() => setExpanded((current) => !current)}
            >
              <span className="hidden sm:inline">{expanded ? t("Свернуть") : t("Показать")}</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
                aria-hidden
              />
            </Button>
          ) : null}
        </div>
      ) : null}

      {preferenceCount === 0 ? (
        <div className={cn("px-4 py-4 text-sm text-muted-foreground sm:px-5", !embedded && "border-t border-border/34")}>
          {t("Пользователь пока не добавил подсказки для подарков.")}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {expanded || embedded ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(embedded ? "space-y-4 py-1" : "space-y-3 border-t border-border/34 p-3 sm:p-4")}
            >
              <div className={cn("grid gap-4", !embedded && "xl:grid-cols-3")}>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-primary/80">
                    {t("Понравится")}
                  </p>
                  {positiveRows.map((row) => (
                    <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-destructive/86">
                    {t("Не подойдёт")}
                  </p>
                  {avoidRows.map((row) => (
                    <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-warning/90">
                    {t("Детали")}
                  </p>
                  <div>
                    {detailRows.map((row) => (
                      <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                    ))}
                  </div>
                  {preferences.notes ? (
                    <p
                      className={cn(
                        "mt-3 border-l-2 border-primary/28 text-sm leading-relaxed text-muted-foreground",
                        embedded ? "pl-3" : "px-3 py-2",
                      )}
                    >
                      {preferences.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </section>
  );
}
