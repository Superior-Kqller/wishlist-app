"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { CalendarDays, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import type { BirthdayOccurrence } from "@/lib/calendar/birthday-calendar";

import type { HolidayOccurrence } from "@/lib/calendar/holiday-calendar";

type CalendarOccurrence = BirthdayOccurrence | HolidayOccurrence;
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
            description={t("Дни рождения и общие праздники, доступные вам")}
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
              title={t("Нет доступных дней рождения")}
              description={t("Добавьте день рождения в настройках профиля")}
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
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {entry.type === "BIRTHDAY" ? entry.person.name : entry.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.type === "HOLIDAY"
                              ? t("Общий праздник")
                              : entry.isOwn
                                ? t("Ваш день рождения")
                                : t("День рождения")}
                          </p>
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
