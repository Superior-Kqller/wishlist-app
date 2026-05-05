import { Clock3 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
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
  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  return (
    <aside className={cn(uiSurface.contentPanel, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Активность</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Последние изменения в видимых товарах
          </p>
        </div>
        <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>

      {recentItems.length > 0 ? (
        <div className="mt-4 space-y-3">
          {recentItems.map((item) => {
            const actor =
              item.status === "CLAIMED" && item.claimedByUser
                ? item.claimedByUser
                : item.user;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
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
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {getActivityLabel(item)}
                        {actor ? ` · ${actor.name}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[10px]", getItemStatusTone(item.status))}
                    >
                      {getItemStatusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatActivityDate(item.updatedAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn(uiSurface.emptyState, "mt-4 min-h-0 px-3 py-6")}>
          <p className="text-sm font-medium text-foreground">Пока нет активности</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Добавленные и обновленные товары появятся здесь.
          </p>
        </div>
      )}
    </aside>
  );
}
