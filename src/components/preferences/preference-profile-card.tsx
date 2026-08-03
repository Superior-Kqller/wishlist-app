"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Heart, Pencil, Ruler, ShieldAlert } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getPreferenceColor } from "@/components/preferences/preference-signal-row";
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
  // Обе кнопки управляют одной областью, значит объявляют одно и то же
  // состояние и указывают на один и тот же регион: раньше aria-expanded был
  // только у имени, и озвучка зависела от того, куда попал фокус.
  const panelId = `preference-profile-panel-${id}`;
  const preferences = normalizeGiftPreferences(rawPreferences);
  const preferenceCount = countGiftPreferences(preferences);
  const likedCount =
    preferences.favoriteBrands.length +
    preferences.favoriteColors.length +
    preferences.favoriteCategories.length +
    preferences.favoriteMaterials.length +
    preferences.hobbies.length;
  const avoidCount =
    preferences.dislikedBrands.length +
    preferences.dislikedColors.length +
    preferences.dislikedCategories.length +
    preferences.dislikedMaterials.length +
    preferences.doNotBuy.length;
  const detailCount = [preferences.sizes, preferences.budget, ...preferences.occasions].filter(
    Boolean,
  ).length;

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
      className={cn(
        "group overflow-hidden rounded-2xl border bg-[hsl(var(--surface-2))] shadow-none",
        isCurrent ? "border-primary/42" : "border-border/58",
        expanded && "border-primary/52",
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
            aria-controls={panelId}
            className="min-w-0 flex-1 rounded-lg text-left active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{name}</h2>
              {isCurrent ? (
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
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
                aria-label={editing ? t("Закрыть") : t("Настроить")}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{editing ? t("Закрыть") : t("Настроить")}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={expanded ? t("Свернуть профиль") : t("Открыть профиль")}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </Button>
          </div>
        </div>

        <div className="mt-5 border-t border-border/42 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-xl font-semibold tabular-nums">{preferenceCount}</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("подсказок для подарка")}
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {preferenceCount === 0
                  ? t("Профиль ждёт первых подсказок")
                  : preferenceCount < 6
                    ? t("Уже есть за что зацепиться")
                    : t("Можно выбирать подарок увереннее")}
              </p>
            </div>
            {preferences.favoriteColors.length > 0 ? (
              <div className="flex -space-x-1.5 pt-1" aria-label={t("Любимые цвета")}>
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
          {!expanded ? (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/34 pt-3 text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Heart className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{`${t("Нравится")}: ${likedCount}`}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-destructive/80" aria-hidden />
                <span className="truncate">{`${t("Избегать")}: ${avoidCount}`}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Ruler className="h-3.5 w-3.5 shrink-0 text-warning/85" aria-hidden />
                <span className="truncate">{`${t("Детали")}: ${detailCount}`}</span>
              </span>
            </div>
          ) : null}

          {typeof wishCount === "number" ? (
            <p className="mt-3 text-xs text-muted-foreground">{`${t("Желаний в подборках")}: ${wishCount}`}</p>
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
            id={panelId}
            className="border-t border-border/48 px-4 py-4 sm:px-5 sm:py-5"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
