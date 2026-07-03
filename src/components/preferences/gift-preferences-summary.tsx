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

type PreferenceSignalRowProps = {
  icon: typeof Heart;
  label: string;
  values: string[];
  empty?: string;
  warning?: boolean;
  accent?: "primary" | "danger" | "warning" | "muted";
  limit?: number;
  compact?: boolean;
};

const colorValues: Record<string, string> = {
  "розовый": "#e7a6b8",
  "красный": "#c75b64",
  "бордовый": "#8f3e4b",
  "оранжевый": "#d78a4d",
  "жёлтый": "#d8b84a",
  "желтый": "#d8b84a",
  "зелёный": "#6f9b76",
  "зеленый": "#6f9b76",
  "хаки": "#7b7d57",
  "мятный": "#8bbfaf",
  "голубой": "#77aabd",
  "синий": "#56789f",
  "фиолетовый": "#8c729c",
  "лавандовый": "#b5a6cf",
  "белый": "#ece9e1",
  "молочный": "#f1eadc",
  "бежевый": "#cdbb9f",
  "коричневый": "#80604d",
  "серый": "#8c9097",
  "графитовый": "#454a52",
  "серебристый": "#b8bdc4",
  "деним": "#4f6787",
  "чёрный": "#292a2e",
  "черный": "#292a2e",
};

function getIconColor(accent: PreferenceSignalRowProps["accent"], warning: boolean) {
  if (warning || accent === "danger") return "text-destructive";
  if (accent === "warning") return "text-warning";
  if (accent === "muted") return "text-muted-foreground";
  return "text-primary";
}

function PreferenceSignalRow({
  icon: Icon,
  label,
  values,
  empty = "Не указано",
  warning = false,
  accent = "primary",
  limit = 3,
  compact = false,
}: PreferenceSignalRowProps) {
  const { t } = useI18n();
  const visibleValues = values.filter(Boolean).slice(0, limit);
  const hiddenCount = Math.max(0, values.filter(Boolean).length - visibleValues.length);
  const colorDots = label.toLocaleLowerCase("ru-RU").includes("цвет");

  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border/32 bg-[hsl(var(--surface-3))/0.34]",
        compact ? "px-2 py-1.5" : "px-2.5 py-2.5",
      )}
    >
      <div className={cn("flex min-w-0 items-center gap-1.5", compact ? "mb-1" : "mb-2")}>
        <Icon
          className={cn(
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
            "shrink-0",
            getIconColor(accent, warning),
          )}
          aria-hidden
        />
        <span className="min-w-0 truncate text-[11px] font-semibold text-muted-foreground">{t(label)}</span>
      </div>
      {visibleValues.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-1.5 text-sm font-medium text-foreground/86">
          {visibleValues.map((value) => (
            <span
              key={value}
              className={cn(
                "inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-border/32 bg-[hsl(var(--surface-2))/0.62] text-xs font-semibold",
                compact ? "min-h-6 px-1.5" : "min-h-7 px-2",
              )}
            >
              {colorDots ? (
                <span
                  className="size-2.5 shrink-0 rounded-full border border-foreground/15"
                  style={{ backgroundColor: colorValues[value.toLocaleLowerCase("ru-RU")] ?? "#77777f" }}
                  aria-hidden
                />
              ) : null}
              <span className="min-w-0 truncate">{t(value)}</span>
            </span>
          ))}
          {hiddenCount > 0 ? (
            <span
              className={cn(
                "inline-flex items-center rounded-lg border border-border/42 text-[11px] font-semibold text-muted-foreground",
                compact ? "min-h-6 px-1.5" : "min-h-7 px-2",
              )}
            >
              +{hiddenCount}
            </span>
          ) : null}
        </div>
      ) : (
        <span className="truncate text-sm text-muted-foreground/72">{t(empty)}</span>
      )}
    </div>
  );
}

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
  const rowLimit = embedded ? 2 : 3;
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
      limit: embedded ? 2 : 4,
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
      limit: embedded ? 2 : 4,
    },
  ];

  return (
    <section
      className={cn(
        "overflow-hidden",
        embedded
          ? "rounded-xl border border-border/48 bg-[hsl(var(--surface-2))/0.56]"
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
              className={cn("space-y-3 p-3 sm:p-4", !embedded && "border-t border-border/34")}
            >
              <div className={cn("grid gap-3", embedded ? "sm:grid-cols-2" : "xl:grid-cols-3")}>
                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/80">
                    {t("Понравится")}
                  </p>
                  {positiveRows.map((row) => (
                    <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                  ))}
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive/86">
                    {t("Не подойдёт")}
                  </p>
                  {avoidRows.map((row) => (
                    <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                  ))}
                </div>
                <div className={cn("min-w-0 space-y-2", embedded && "sm:col-span-2")}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-warning/90">
                    {t("Детали")}
                  </p>
                  <div className={cn("grid gap-2", embedded && "sm:grid-cols-3")}>
                    {detailRows.map((row) => (
                      <PreferenceSignalRow key={row.label} {...row} compact={rowCompact} />
                    ))}
                  </div>
                  {preferences.notes ? (
                    <p
                      className={cn(
                        "rounded-lg border border-primary/22 bg-primary/7 text-sm leading-relaxed text-muted-foreground",
                        embedded ? "px-2.5 py-2" : "px-3 py-2",
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
