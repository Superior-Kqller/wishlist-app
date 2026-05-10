"use client";

import { useState } from "react";
import { ChevronDown, Clock3 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { getItemStatusLabel, getItemStatusTone } from "@/lib/item-status-presentation";
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
  if (item.status === "CLAIMED") return t("Забронировано");
  if (item.updatedAt !== item.createdAt) return t("Обновлено");
  return t("Добавлено");
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  const { language, locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);
  const visibleItems = expanded ? recentItems : recentItems.slice(0, 2);

  return (
    <aside className={cn(uiSurface.contentPanel, "flex h-full flex-col rounded-xl border-border/50 bg-[hsl(var(--surface-2))/0.58] p-2 shadow-[0_6px_16px_rgba(0,0,0,0.16)] sm:rounded-2xl sm:p-5 sm:shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_hsl(var(--foreground)/0.04)]")}>
      <div className="flex items-center justify-between gap-2.5">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground/90 sm:text-sm">{t("Активность")}</h2>
          <p className="text-[10px] text-muted-foreground/70 sm:mt-0.5 sm:text-xs">{t("Последние изменения")}</p>
        </div>
        <Clock3 className="h-3.5 w-3.5 text-muted-foreground/65 sm:h-4 sm:w-4" aria-hidden />
      </div>

      {recentItems.length > 0 ? (
        <div className="mt-1.5 space-y-1.5 sm:mt-3 sm:space-y-2.5">
          {visibleItems.map((item) => {
            const actor =
              item.status === "CLAIMED" && item.claimedByUser
                ? item.claimedByUser
                : item.user;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-1.5 border-t border-border/35 pt-1.5 first:border-t-0 first:pt-0 sm:gap-2.5 sm:border-border/60 sm:pt-2.5"
              >
                {actor ? (
                  <UserAvatar
                    avatarUrl={actor.avatarUrl || undefined}
                    name={actor.name}
                    userId={actor.id}
                    size="sm"
                    className="h-5 w-5 text-[10px] sm:h-6 sm:w-6"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-border/60 bg-[hsl(var(--surface-3))] sm:h-6 sm:w-6" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground/90 sm:text-sm">
                        {item.title}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground/70 sm:mt-0.5 sm:text-xs">
                        {getActivityLabel(item, t)}
                        {actor ? ` · ${actor.name}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 px-1 py-0 text-[9px] leading-4 opacity-85 sm:px-1.5 sm:text-[10px]", getItemStatusTone(item.status))}
                    >
                      {getItemStatusLabel(item.status, language)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 sm:mt-1 sm:text-[11px]">
                    {formatActivityDate(item.updatedAt, locale)}
                  </p>
                </div>
              </div>
            );
          })}
          {recentItems.length > 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-full gap-1 text-[11px] text-muted-foreground/80 sm:h-8 sm:gap-1.5 sm:text-xs"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t("Свернуть") : t("Все изменения")}
              <ChevronDown
                className={cn("h-3 w-3 transition-transform sm:h-3.5 sm:w-3.5", expanded && "rotate-180")}
              />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={cn(uiSurface.emptyState, "mt-2 min-h-0 flex-1 border-border/50 bg-[hsl(var(--surface-2))/0.5] px-3 py-2.5 sm:mt-4 sm:py-6")}>
          <p className="text-sm font-medium text-foreground">{t("Пока нет активности")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">
            {t("Добавленные и обновленные товары появятся здесь.")}
          </p>
        </div>
      )}
    </aside>
  );
}
