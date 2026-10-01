"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Pencil, Plus } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import {
  getVisibleRecentActivityItems,
  hasMoreRecentActivityItems,
} from "@/lib/home/recent-activity";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

type RecentActivityPanelProps = {
  items: WishlistItem[];
};

function getActivity(item: WishlistItem) {
  if (item.status === "PURCHASED") return { label: "Отмечено как купленное", icon: Check };
  if (item.updatedAt !== item.createdAt) return { label: "Обновлено", icon: Pencil };
  return { label: "Добавлено", icon: Plus };
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Лента последних изменений — Activity Timeline (21st.dev, olewandowski1):
 * записи сгруппированы по дням под подписью-разделителем, слева тонкий рельс
 * за аватарами, на аватаре — маленький значок действия, справа время.
 * Значок, а не цветная плашка статуса: «куплено» читается действием.
 */
export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  const { locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const visibleItems = getVisibleRecentActivityItems(items, { expanded });
  const hasMoreItems = hasMoreRecentActivityItems(items);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayLabel = (date: Date) =>
    dayKey(date) === dayKey(today)
      ? t("Сегодня")
      : dayKey(date) === dayKey(yesterday)
        ? t("Вчера")
        : date.toLocaleDateString(locale, { day: "numeric", month: "long" });

  const groups: { key: string; label: string; items: WishlistItem[] }[] = [];
  for (const item of visibleItems) {
    const date = new Date(item.updatedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(date), items: [item] });
  }

  return (
    <section className="min-w-0" aria-labelledby="recent-activity-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="recent-activity-title" className="section-title">
            {t("Активность")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("Последние изменения")}</p>
        </div>
        {hasMoreItems ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("Свернуть") : t("Все изменения")}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-base", expanded && "rotate-180")}
              aria-hidden
            />
          </Button>
        ) : null}
      </div>

      {groups.length > 0 ? (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3">
              <p className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                {group.label}
                <span aria-hidden className="h-px flex-1 bg-border" />
              </p>
              <ol className="relative flex flex-col gap-1">
                <span
                  aria-hidden
                  className="absolute bottom-5 left-[1.625rem] top-5 w-px bg-border"
                />
                {group.items.map((item) => {
                  const actor = item.user;
                  const ownerId = actor?.id ?? item.userId;
                  const activity = getActivity(item);
                  const Icon = activity.icon;
                  return (
                    <li key={item.id}>
                      {/* Ведём к вишлисту владельца — отдельного маршрута у желания нет. */}
                      <Link
                        href={ownerId ? `/?userId=${ownerId}` : "/"}
                        className="relative flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-fast hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="relative shrink-0">
                          {actor ? (
                            <UserAvatar
                              avatarUrl={actor.avatarUrl || undefined}
                              name={actor.name}
                              userId={actor.id}
                              size="sm"
                              className="size-9 text-xs ring-4 ring-background"
                            />
                          ) : (
                            <span className="block size-9 rounded-full bg-[hsl(var(--surface-4))] ring-4 ring-background" />
                          )}
                          <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border border-border bg-background text-foreground">
                            <Icon className="size-2.5" aria-hidden />
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {t(activity.label)}
                            {actor ? ` · ${actor.name}` : null}
                          </span>
                        </span>
                        <time
                          dateTime={item.updatedAt}
                          className="shrink-0 text-xs tabular-nums text-muted-foreground"
                        >
                          {new Date(item.updatedAt).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-[hsl(var(--surface-3))] px-4 py-6 text-center">
          <p className="text-sm font-medium">{t("Пока нет активности")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Добавленные и обновлённые желания появятся здесь.")}
          </p>
        </div>
      )}
    </section>
  );
}
