"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Pencil } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getPreferenceColor } from "@/components/preferences/preference-signal-row";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getPreferenceHighlights } from "@/lib/preference-profiles";
import { type GiftPreferences } from "@/lib/preferences";

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
  /** Подпись кнопки редактирования: меняется, если остался незаконченный черновик. */
  editLabel?: string;
  children?: ReactNode;
};

export function PreferenceProfileCard({
  id,
  name,
  username,
  avatarUrl,
  preferences,
  wishCount,
  isCurrent = false,
  expanded,
  editing = false,
  onToggle,
  onEdit,
  editLabel,
  children,
}: PreferenceProfileCardProps) {
  const { t, language } = useI18n();
  const reduceMotion = useReducedMotion();
  // Обе кнопки управляют одной областью, значит объявляют одно и то же
  // состояние и указывают на один и тот же регион: раньше aria-expanded был
  // только у имени, и озвучка зависела от того, куда попал фокус.
  const panelId = `preference-profile-panel-${id}`;

  /*
   * Свёрнутая карточка раньше показывала пять чисел и одну строку смысла:
   * крупный счётчик «подсказок для подарка», оценочную фразу под ним и
   * три счётчика разделов. Это метрика откровенности анкеты, выставленная
   * на общий обзор родне, — и ни одно из чисел не помогает выбрать подарок.
   * Теперь на её месте стоит то, ради чего профиль открывают: что человеку
   * подойдёт и чего дарить нельзя.
   */
  const highlights = getPreferenceHighlights(preferences);
  const hasHighlights =
    highlights.likes.length > 0 || highlights.colors.length > 0 || highlights.avoid.length > 0;

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
            {/* Число желаний — единственный счётчик, который остался: он говорит,
                есть ли вообще куда идти дальше. Место ему в подписи, не в теле,
                и формулировка короткая — иначе строка обрезается рядом с кнопкой. */}
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              @{username}
              {typeof wishCount === "number"
                ? ` · ${wishCount} ${getWishWord(language, wishCount)}`
                : null}
            </p>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            {isCurrent && onEdit ? (
              <Button
                type="button"
                size="sm"
                variant={editing ? "default" : "outline"}
                className="gap-1.5"
                onClick={onEdit}
                aria-label={editLabel ?? t("Настроить")}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{editLabel ?? t("Настроить")}</span>
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

        {!expanded ? (
          <div className="mt-4 space-y-2 border-t border-border/42 pt-4 text-sm">
            {hasHighlights ? (
              <>
                {/* Обычный inline-поток, а не flex: подпись и значения переносятся
                    как одно предложение, а кружки цветов встают следом за
                    последним словом, а не отдельной висящей строкой. */}
                {highlights.likes.length > 0 || highlights.colors.length > 0 ? (
                  <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                    <span className="text-muted-foreground">
                      {highlights.likes.length > 0 ? t("Подойдёт") : t("Любимые цвета")}:{" "}
                    </span>
                    <span className="text-foreground/88">
                      {highlights.likes.map((value) => t(value)).join(", ")}
                    </span>
                    {highlights.likesHidden > 0 ? (
                      <span className="text-muted-foreground"> +{highlights.likesHidden}</span>
                    ) : null}
                    {highlights.colors.length > 0 ? (
                      <span
                        className={cn(
                          "inline-flex -space-x-1.5 align-text-bottom",
                          highlights.likes.length > 0 && "ml-2",
                        )}
                        aria-label={`${t("Любимые цвета")}: ${highlights.colors
                          .map((color) => t(color))
                          .join(", ")}`}
                      >
                        {highlights.colors.map((color) => (
                          <span
                            key={color}
                            title={t(color)}
                            className="size-4 rounded-full border-2 border-[hsl(var(--surface-2))]"
                            style={{ backgroundColor: getPreferenceColor(color) }}
                          />
                        ))}
                      </span>
                    ) : null}
                  </p>
                ) : null}

                {highlights.avoid.length > 0 ? (
                  <p className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                    <span className="text-muted-foreground">{t("Не дарить")}: </span>
                    <span className="font-medium text-destructive">
                      {highlights.avoid.map((value) => t(value)).join(", ")}
                    </span>
                    {highlights.avoidHidden > 0 ? (
                      <span className="text-muted-foreground"> +{highlights.avoidHidden}</span>
                    ) : null}
                  </p>
                ) : null}
              </>
            ) : (
              /* Пустой профиль чужого человека — просто факт, а не упрёк:
                 фраза «Профиль ждёт первых подсказок» оценивала того, кто
                 ничего не обещал заполнять. */
              <p className="text-muted-foreground">
                {isCurrent
                  ? t("Расскажите о себе — друзьям будет проще выбрать подарок.")
                  : t("Подсказок пока нет.")}
              </p>
            )}
          </div>
        ) : null}
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
