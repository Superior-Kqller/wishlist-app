"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, Pencil } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import {
  OCCASION_SOON_DAYS,
  useOccasionParts,
  type ProfileOccasion,
} from "@/components/preferences/person-card";
import { useI18n } from "@/components/i18n/language-provider";
import { getWishWord } from "@/lib/i18n";
import { easing } from "@/lib/motion";
import { normalizeGiftPreferences, type GiftPreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/*
 * Смена человека проигрывается как Stagger Entrance (kinetics): блоки сцены
 * поднимаются на 14px по очереди, 450ms `expo`, шаг 90ms. Ключ — id человека,
 * так что лесенка играет на каждый выбор, а не на каждую перерисовку.
 */
const stagger = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easing.expo } },
};

/**
 * Сцена выбранного человека — липкая карточка по DESIGN.md (как карточка
 * действий в окне желания): лицо и имя, ближайший повод, одно главное
 * действие — уйти в его список желаний, ниже полная сводка. Для своего
 * профиля главное действие — настроить его.
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
  const reduceMotion = useReducedMotion();
  const occasionParts = useOccasionParts();
  const preferences = normalizeGiftPreferences(rawPreferences);
  const headingId = `profile-stage-${id}`;
  const parts = occasion && !isCurrent ? occasionParts(occasion) : null;
  const soon = parts && occasion && occasion.days <= OCCASION_SOON_DAYS;

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-float)]"
    >
      <motion.div
        key={id}
        variants={stagger}
        initial={reduceMotion ? false : "hidden"}
        animate="shown"
      >
        <motion.div variants={rise} className="flex items-center gap-4 px-6 pt-6">
          <UserAvatar
            avatarUrl={avatarUrl}
            name={name}
            userId={id}
            size="xl"
            className="size-16 shrink-0 text-xl"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 id={headingId} className="section-title min-w-0 truncate">
                {name}
              </h2>
              {isCurrent && hasDraft ? <Badge variant="warning">{t("Черновик")}</Badge> : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              @{username}
              {typeof wishCount === "number"
                ? ` · ${wishCount} ${getWishWord(language, wishCount)}`
                : null}
            </p>
          </div>
        </motion.div>

        {parts ? (
          <motion.p
            variants={rise}
            className={cn(
              "mx-6 mt-4 flex items-center gap-2 text-sm",
              soon ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {soon ? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" /> : null}
            {t("День рождения")} {parts.when} · {parts.date}
          </motion.p>
        ) : null}

        <motion.div variants={rise} className="px-6 pb-6 pt-5">
          {isCurrent ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="secondary" size="lg">
                <Link href="/preferences/me">
                  <Pencil className="h-4 w-4" aria-hidden />
                  {hasDraft ? t("Продолжить заполнение") : t("Настроить профиль")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/?userId=me">
                  <Gift className="h-4 w-4" aria-hidden />
                  {t("Мой список")}
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link href={`/?userId=${id}`}>
                <Gift className="h-4 w-4" aria-hidden />
                {t("Открыть список желаний")}
              </Link>
            </Button>
          )}
        </motion.div>

        <motion.div variants={rise} className="@container border-t border-border px-6 py-6">
          <GiftPreferencesSummary preferences={preferences} embedded isOwn={isCurrent} />
        </motion.div>
      </motion.div>
    </section>
  );
}
