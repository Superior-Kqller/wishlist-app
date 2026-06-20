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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import {
  countGiftPreferences,
  normalizeGiftPreferences,
  type GiftPreferences,
} from "@/lib/preferences";
import { uiSurface } from "@/lib/ui-contract";

type GiftPreferencesSummaryProps = {
  userName: string;
  preferences?: GiftPreferences | null;
  embedded?: boolean;
};

function PreferenceBadges({
  values,
  warning = false,
}: {
  values: string[];
  warning?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <Badge
          key={value}
          variant="outline"
          className={cn(
            "max-w-full truncate border-border/62 bg-[hsl(var(--surface-3))/0.58] px-2.5 py-1 text-xs font-medium text-foreground/82",
            warning && "border-destructive/30 bg-destructive/8 text-destructive",
          )}
        >
          {value}
        </Badge>
      ))}
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
  const likes = [
    ...preferences.favoriteColors,
    ...preferences.favoriteMaterials,
    ...preferences.favoriteBrands,
    ...preferences.hobbies,
  ];
  const avoid = [
    ...preferences.dislikedColors,
    ...preferences.dislikedMaterials,
    ...preferences.dislikedBrands,
    ...preferences.doNotBuy,
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
              className={cn(
                "grid gap-px bg-border/30 lg:grid-cols-3",
                !embedded && "border-t border-border/34",
              )}
            >
              <div className="space-y-2.5 bg-[hsl(var(--surface-2))/0.96] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Heart className="h-4 w-4 text-primary" aria-hidden />
                  {t("Можно смело выбирать")}
                </div>
                {likes.length > 0 ? (
                  <PreferenceBadges values={likes} />
                ) : (
                  <p className="text-sm text-muted-foreground">{t("Нет отдельных подсказок")}</p>
                )}
              </div>

              <div className="space-y-2.5 bg-[hsl(var(--surface-2))/0.96] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />
                  {t("Лучше не покупать")}
                </div>
                {avoid.length > 0 ? (
                  <PreferenceBadges values={avoid} warning />
                ) : (
                  <p className="text-sm text-muted-foreground">{t("Ограничений не указано")}</p>
                )}
              </div>

              <div className="space-y-3 bg-[hsl(var(--surface-2))/0.96] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-warning" aria-hidden />
                  {t("Важные детали")}
                </div>
                <div className="space-y-2 text-sm">
                  {preferences.sizes ? (
                    <p className="flex gap-2 text-foreground/82">
                      <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>{preferences.sizes}</span>
                    </p>
                  ) : null}
                  {preferences.budget ? (
                    <p className="flex gap-2 text-foreground/82">
                      <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>{preferences.budget}</span>
                    </p>
                  ) : null}
                  {preferences.occasions.length > 0 ? (
                    <PreferenceBadges values={preferences.occasions} />
                  ) : null}
                  {preferences.notes ? (
                    <p className="border-l-2 border-primary/35 pl-3 leading-relaxed text-muted-foreground">
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
