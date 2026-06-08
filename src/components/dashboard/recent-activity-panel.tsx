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
    <aside className={cn(uiSurface.contentPanel, "flex h-full flex-col rounded-xl border-border/42 bg-[hsl(var(--surface-2))/0.66] p-3 shadow-[0_12px_28px_rgba(0,0,0,0.22),inset_0_1px_0_hsl(var(--foreground)/0.04)] sm:rounded-2xl sm:p-4")}>
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h2 className="text-sm font-semibold text-foreground/92">{t("Активность")}</h2>
          <p className="text-[11px] text-muted-foreground/72 sm:mt-0.5">{t("Последние изменения")}</p>
        </div>
        {recentItems.length > 2 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-full px-2 text-[11px] text-primary/86 hover:text-primary"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("Свернуть") : t("Все изменения")}
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
            />
          </Button>
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/48 bg-[hsl(var(--surface-3))/0.72] text-muted-foreground/62">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>

      {recentItems.length > 0 ? (
        <div className="relative mt-3 space-y-2 pl-1 before:absolute before:bottom-1 before:left-[0.625rem] before:top-1 before:w-px before:bg-border/36">
          {visibleItems.map((item) => {
            const actor =
              item.status === "CLAIMED" && item.claimedByUser
                ? item.claimedByUser
                : item.user;

            return (
              <div
                key={item.id}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-xl border border-border/26 bg-[hsl(var(--surface-3))/0.42] p-2.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)]"
              >
                <span className="absolute left-[0.43rem] top-4 z-[1] h-2.5 w-2.5 rounded-full border border-[hsl(var(--surface-2))] bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.14)]" aria-hidden />
                {actor ? (
                  <UserAvatar
                    avatarUrl={actor.avatarUrl || undefined}
                    name={actor.name}
                    userId={actor.id}
                    size="sm"
                    className="relative z-[2] h-5 w-5 text-[10px]"
                  />
                ) : (
                  <div className="relative z-[2] h-5 w-5 rounded-full border border-border/50 bg-[hsl(var(--surface-3))]" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground/90">
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground/72 sm:mt-0.5">
                        {getActivityLabel(item, t)}
                        {actor ? ` · ${actor.name}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 px-1.5 py-0 text-[10px] leading-4 opacity-86", getItemStatusTone(item.status))}
                    >
                      {getItemStatusLabel(item.status, language)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground/48 sm:mt-0.5">
                    {formatActivityDate(item.updatedAt, locale)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn(uiSurface.emptyState, "mt-3 min-h-0 flex-1 border-border/50 bg-[hsl(var(--surface-3))/0.38] px-3 py-4 sm:mt-4 sm:py-6")}>
          <p className="text-sm font-medium text-foreground">{t("Пока нет активности")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">
            {t("Добавленные и обновленные товары появятся здесь.")}
          </p>
        </div>
      )}
    </aside>
  );
}
