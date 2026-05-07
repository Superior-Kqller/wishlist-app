"use client";

import { useState } from "react";
import { ChevronDown, Clock3 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getItemStatusLabel, getItemStatusTone } from "@/lib/item-status-presentation";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import type { WishlistItem } from "@/types";

type RecentActivityPanelProps = {
  items: WishlistItem[];
};

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityLabel(item: WishlistItem) {
  if (item.status === "PURCHASED") return "Отмечено как купленное";
  if (item.status === "CLAIMED") return "Забронировано";
  if (item.updatedAt !== item.createdAt) return "Обновлено";
  return "Добавлено";
}

export function RecentActivityPanel({ items }: RecentActivityPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);
  const visibleItems = expanded ? recentItems : recentItems.slice(0, 2);

  return (
    <aside className={cn(uiSurface.contentPanel, "flex h-full flex-col rounded-xl p-2.5 shadow-[0_8px_22px_rgba(0,0,0,0.22)] sm:rounded-2xl sm:p-5 sm:shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_hsl(var(--foreground)/0.04)]")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Активность</h2>
          <p className="text-[11px] text-muted-foreground sm:mt-0.5 sm:text-xs">Последние изменения</p>
        </div>
        <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>

      {recentItems.length > 0 ? (
        <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-2.5">
          {visibleItems.map((item) => {
            const actor =
              item.status === "CLAIMED" && item.claimedByUser
                ? item.claimedByUser
                : item.user;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border/60 pt-2 first:border-t-0 first:pt-0 sm:gap-2.5 sm:pt-2.5"
              >
                {actor ? (
                  <UserAvatar
                    avatarUrl={actor.avatarUrl || undefined}
                    name={actor.name}
                    userId={actor.id}
                    size="sm"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full border border-border bg-[hsl(var(--surface-3))]" />
                )}
                <div className="min-w-0">
                  <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground sm:text-sm">
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground sm:mt-0.5 sm:text-xs">
                        {getActivityLabel(item)}
                        {actor ? ` · ${actor.name}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 px-1.5 py-0 text-[10px]", getItemStatusTone(item.status))}
                    >
                      {getItemStatusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1">
                    {formatActivityDate(item.updatedAt)}
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
              className="h-8 w-full gap-1.5 text-xs text-muted-foreground"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Свернуть" : "Все изменения"}
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
              />
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={cn(uiSurface.emptyState, "mt-2 min-h-0 flex-1 px-3 py-3 sm:mt-4 sm:py-6")}>
          <p className="text-sm font-medium text-foreground">Пока нет активности</p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">
            Добавленные и обновленные товары появятся здесь.
          </p>
        </div>
      )}
    </aside>
  );
}
