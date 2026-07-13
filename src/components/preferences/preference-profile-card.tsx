"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Gift, Heart, Pencil, ShieldAlert, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import {
  getPreferenceColor,
  PreferenceSignalRow,
} from "@/components/preferences/preference-signal-row";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import {
  countGiftPreferences,
  normalizeGiftPreferences,
  type GiftPreferences,
} from "@/lib/preferences";

type PreferenceProfileCardProps = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  preferences?: GiftPreferences | null;
  wishCount?: number;
  isCurrent?: boolean;
  expanded: boolean;
  editing?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  children?: ReactNode;
};

export function PreferenceProfileCard({
  id,
  name,
  username,
  avatarUrl,
  preferences: rawPreferences,
  wishCount,
  isCurrent = false,
  expanded,
  editing = false,
  onToggle,
  onEdit,
  children,
}: PreferenceProfileCardProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const preferences = normalizeGiftPreferences(rawPreferences);
  const preferenceCount = countGiftPreferences(preferences);
  const progress = Math.min(100, Math.round((preferenceCount / 12) * 100));
  const excluded = [
    ...preferences.dislikedBrands,
    ...preferences.dislikedColors,
    ...preferences.dislikedCategories,
    ...preferences.dislikedMaterials,
  ];
  const details = [preferences.sizes, preferences.budget, ...preferences.occasions].filter(Boolean);

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
      className={cn(
        "group overflow-hidden rounded-xl border bg-[hsl(var(--surface-2))/0.8] shadow-none",
        isCurrent ? "border-primary/38 border-l-2" : "border-border/58",
        expanded && "border-primary/44",
      )}
    >
      <div className="overflow-hidden p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <UserAvatar
              avatarUrl={avatarUrl}
              name={name}
              userId={id}
              size="xl"
              className="ring-2 ring-background ring-offset-1 ring-offset-border/40"
            />
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{name}</h2>
              {isCurrent ? (
                <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
                  {t("Это вы")}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">@{username}</p>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            {isCurrent && onEdit ? (
              <Button
                type="button"
                size="sm"
                variant={editing ? "default" : "outline"}
                className="gap-1.5"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{editing ? t("Закрыть") : t("Настроить")}</span>
              </Button>
            ) : null}
            <Button type="button" size="icon" variant="ghost" onClick={onToggle} aria-label={t("Открыть профиль")}>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")}
                aria-hidden
              />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-0">
          <div className="min-w-0 space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t("Подсказки")}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{preferenceCount}</p>
              </div>
              {preferences.favoriteColors.length > 0 ? (
                <div className="flex -space-x-1.5 pb-1" aria-label={t("Любимые цвета")}>
                  {preferences.favoriteColors.slice(0, 5).map((color) => (
                    <span
                      key={color}
                      title={t(color)}
                      className="size-5 rounded-full border-2 border-[hsl(var(--surface-2))]"
                      style={{ backgroundColor: getPreferenceColor(color) }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
              <motion.div
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
                className="h-full origin-left rounded-full bg-primary/72"
              />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {preferenceCount === 0
                ? t("Профиль ждёт первых подсказок")
                : preferenceCount < 6
                  ? t("Уже есть за что зацепиться")
                  : t("Можно выбирать подарок увереннее")}
            </p>
          </div>

          <div className="mt-4 border-y border-border/42 py-1">
            <PreferenceSignalRow
              icon={Heart}
              label="Бренды"
              values={preferences.favoriteBrands}
              empty="Бренды не указаны"
              limit={3}
            />
            <PreferenceSignalRow
              icon={Sparkles}
              label="Цвета"
              values={preferences.favoriteColors}
              empty="Цвета не выбраны"
              limit={3}
              colorDots
            />
            <PreferenceSignalRow
              icon={Gift}
              label="Категории"
              values={preferences.favoriteCategories}
              empty="Категории не указаны"
              limit={3}
            />
            <PreferenceSignalRow
              icon={ShieldAlert}
              label="Исключения"
              values={excluded}
              empty="Исключений нет"
              limit={3}
              warning
            />
            <PreferenceSignalRow
              icon={ShieldAlert}
              label="Стоп-лист"
              values={preferences.doNotBuy}
              empty="Стоп-лист пока пуст"
              limit={3}
              warning
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/42 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            {details.length > 0 ? `${t("Важных деталей")}: ${details.length}` : t("Детали не указаны")}
          </span>
          {typeof wishCount === "number" ? (
            <span>{`${t("Желаний в подборках")}: ${wishCount}`}</span>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key={editing ? "editor" : "summary"}
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border/48 p-3 sm:p-4"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
