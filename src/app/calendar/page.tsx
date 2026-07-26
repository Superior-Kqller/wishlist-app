"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { UserAvatar } from "@/components/UserAvatar";
import { PersonalEventsPanel } from "@/components/calendar/PersonalEventsPanel";
import { EmptyState } from "@/components/ui/empty-state";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import type { BirthdayOccurrence } from "@/lib/calendar/birthday-calendar";
import type { PersonalEventOccurrence } from "@/lib/calendar/calendar-module";
import type { HolidayOccurrence } from "@/lib/calendar/holiday-calendar";
import { thematicWishlistHref } from "@/lib/calendar/wishlist-link";

type CalendarOccurrence =
  | BirthdayOccurrence
  | PersonalEventOccurrence
  | HolidayOccurrence;

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading, error } = useSWR<{ occurrences: CalendarOccurrence[] }>(
    `/api/calendar?from=${year}-01-01&to=${year}-12-31`,
    fetcher,
  );
  const groupedOccurrences = useMemo(() => {
    const groups = new Map<string, CalendarOccurrence[]>();
    for (const occurrence of data?.occurrences ?? []) {
      const entries = groups.get(occurrence.date);
      if (entries) entries.push(occurrence);
      else groups.set(occurrence.date, [occurrence]);
    }
    return [...groups.entries()];
  }, [data?.occurrences]);

  return (
    <PageShell>
      <PageMain className="max-w-5xl">
        <div className="space-y-4">
          <PageIntro
            title={t("Календарь")}
            description={t("Дни рождения, праздники и личные события, доступные вам")}
            actions={
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t("Год")}</span>
                <select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="h-10 rounded-md border border-input bg-background px-3"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            }
          />

          <PersonalEventsPanel />

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" />}
              title={t("Не удалось загрузить календарь")}
              description={t("Попробуйте обновить страницу")}
            />
          ) : groupedOccurrences.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" />}
              title={t("Нет доступных событий")}
              description={t("Добавьте личное событие или день рождения в настройках профиля")}
            />
          ) : (
            <div className="space-y-3">
              {groupedOccurrences.map(([date, entries]) => (
                <section
                  key={date}
                  className={cn(uiSurface.contentPanel, "overflow-hidden p-4 sm:p-5")}
                >
                  <time
                    dateTime={date}
                    className="text-sm font-semibold capitalize text-muted-foreground"
                  >
                    {new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "long",
                      weekday: "long",
                    })}
                  </time>
                  <div className="mt-3 divide-y divide-border/55">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {entry.type === "BIRTHDAY" ? (
                          <UserAvatar
                            avatarUrl={entry.person.avatarUrl}
                            name={entry.person.name}
                            userId={entry.person.id}
                            size="lg"
                          />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {entry.type === "BIRTHDAY"
                              ? entry.person.name
                              : entry.type === "PERSONAL"
                                ? entry.title
                                : entry.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.type === "HOLIDAY"
                              ? t("Общий праздник")
                              : entry.type === "PERSONAL"
                                ? entry.recurrence === "YEARLY"
                                  ? t("Личное событие · ежегодно")
                                  : t("Личное событие")
                                : entry.isOwn
                                  ? t("Ваш день рождения")
                                  : t("День рождения")}
                          </p>
                          {entry.type === "HOLIDAY" && entry.congratulated.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                {t("Сегодня поздравляем")}
                              </p>
                              {entry.congratulated.map((person) => (
                                <div
                                  key={person.id}
                                  className="rounded-lg border border-border/55 bg-background/25 p-2.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <UserAvatar
                                      avatarUrl={person.avatarUrl}
                                      name={person.name}
                                      userId={person.id}
                                      size="sm"
                                    />
                                    <span className="truncate text-sm font-medium">
                                      {person.name}
                                    </span>
                                  </div>
                                  {person.wishlists.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {person.wishlists.map((wishlist) => (
                                        <Link
                                          key={wishlist.id}
                                          href={thematicWishlistHref(person.id, wishlist.id)}
                                          className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-primary/8"
                                        >
                                          {wishlist.name}
                                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                                        </Link>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
