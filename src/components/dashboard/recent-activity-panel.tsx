"use client";

import { useState } from "react";
import { ChevronDown, Clock3 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { getItemStatusLabel, getItemStatusTone } from "@/lib/item-status-presentation";
import {
  getVisibleRecentActivityItems,
  hasMoreRecentActivityItems,
} from "@/lib/home/recent-activity";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import type { WishlistItem } from "@/types";

type RecentActivityPanelProps = {
  items: WishlistItem[];
};

function formatActivityDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityLabel(item: WishlistItem, t: (key: string) => string) {
  if (item.status === "PURCHASED") return t("Отмечено как купленное");
  if (item.updatedAt !== item.createdAt) return t("Обновлено");
  return t("Добавлено");
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  const { language, locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const visibleItems = getVisibleRecentActivityItems(items, { expanded });
  const hasMoreItems = hasMoreRecentActivityItems(items);

  return (
    <aside
      className={cn(
        uiSurface.contentPanel,
        "flex h-full min-h-[15rem] flex-col overflow-hidden p-3 shadow-none sm:p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
            <Clock3 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-foreground/94">
              {t("Активность")}
            </h2>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/70">
              {t("Последние изменения")}
            </p>
          </div>
        </div>
        {hasMoreItems ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 rounded-lg px-2 text-[11px] text-primary/86 hover:bg-primary/10 hover:text-primary"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("Свернуть") : t("Все изменения")}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </Button>
        ) : null}
      </div>

      {visibleItems.length > 0 ? (
        <div
          className={cn(
            "mt-3 flex flex-1 flex-col gap-1.5",
            expanded && "max-h-[28rem] overflow-y-auto pr-1",
          )}
        >
          {visibleItems.map((item) => {
            const actor = item.user;

            return (
              <div
                key={item.id}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 rounded-xl px-2 py-2.5 transition-colors duration-200 after:absolute after:bottom-[-0.45rem] after:left-[1.15rem] after:top-9 after:w-px after:bg-border/28 last:after:hidden hover:bg-[hsl(var(--surface-3)/0.42)]"
              >
                {actor ? (
                  <UserAvatar
                    avatarUrl={actor.avatarUrl || undefined}
                    name={actor.name}
                    userId={actor.id}
                    size="sm"
                    className="relative z-[1] mt-0.5 h-6 w-6 text-[10px] shadow-[0_0_0_3px_hsl(var(--surface-2))]"
                  />
                ) : (
                  <div className="relative z-[1] mt-0.5 h-6 w-6 rounded-full border border-border/50 bg-[hsl(var(--surface-3))] shadow-[0_0_0_3px_hsl(var(--surface-2))]" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 pt-0.5">
                      <p className="line-clamp-1 text-[13px] font-semibold leading-tight text-foreground/92">
                        {item.title}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-0.5 h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] leading-none opacity-82",
                        getItemStatusTone(item.status),
                      )}
                    >
                      {getItemStatusLabel(item.status, language)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-snug text-muted-foreground/62">
                    <span>{getActivityLabel(item, t)}</span>
                    {actor ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="max-w-[8rem] truncate">{actor.name}</span>
                      </>
                    ) : null}
                    <span aria-hidden>·</span>
                    <time dateTime={item.updatedAt}>
                      {formatActivityDate(item.updatedAt, locale)}
                    </time>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            uiSurface.emptyState,
            "mt-3 min-h-0 flex-1 border-border/50 bg-[hsl(var(--surface-3)/0.38)] px-3 py-4 sm:mt-4 sm:py-6",
          )}
        >
          <p className="text-sm font-medium text-foreground">{t("Пока нет активности")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">
            {t("Добавленные и обновленные товары появятся здесь.")}
          </p>
        </div>
      )}
    </aside>
  );
}
