"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import {
  getUpcomingOccurrences,
  getClientLocalDate,
  getOccurrenceTitle,
  type CalendarOccurrence,
} from "@/lib/calendar/client-calendar";

export function UpcomingCalendarCard() {
  const { t, locale } = useI18n();
  const today = getClientLocalDate();
  const through = `${Number(today.slice(0, 4)) + 1}-${today.slice(5)}`;
  const { data, isLoading, error, mutate } = useSWR<{ occurrences: CalendarOccurrence[] }>(
    `/api/calendar?from=${today}&to=${through}`,
    fetcher,
  );
  const upcoming = getUpcomingOccurrences(data?.occurrences ?? [], today, 3);

  return (
    <section
      className={cn(
        uiSurface.contentPanel,
        "mb-3 overflow-hidden p-3 sm:mb-4 sm:p-5",
      )}
      aria-labelledby="upcoming-calendar-title"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="upcoming-calendar-title" className="text-sm font-semibold sm:text-base">
            {t("Ближайшие события")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground max-sm:hidden">
            {t("Три следующих доступных вам события")}
          </p>
        </div>
        <Link
          href="/calendar"
          aria-label={t("Весь календарь")}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 sm:h-10 sm:w-auto sm:gap-1.5 sm:px-3"
        >
          <span className="max-sm:sr-only">{t("Весь календарь")}</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-20 items-center justify-center" role="status">
          <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none text-muted-foreground" />
          <span className="sr-only">{t("Загрузка календаря")}</span>
        </div>
      ) : error ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/35 bg-destructive/8 px-4 py-3">
          <p className="text-sm text-destructive">
            {t("Не удалось загрузить ближайшие события")}
          </p>
          <button
            type="button"
            className="min-h-9 rounded-lg px-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
            onClick={() => void mutate()}
          >
            {t("Повторить")}
          </button>
        </div>
      ) : upcoming.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground sm:mt-4 sm:px-4 sm:py-5">
          {t("Ближайших событий пока нет")}
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-3 divide-x divide-border/55 rounded-xl bg-primary/[0.04] sm:mt-4 sm:gap-2 sm:divide-x-0 sm:bg-transparent">
          {upcoming.map((occurrence) => {
            const title = getOccurrenceTitle(occurrence);
            return (
              <Link
                key={occurrence.id}
                href="/calendar"
                className="group flex min-w-0 flex-col items-start gap-1 px-2 py-2.5 transition-colors hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 sm:flex-row sm:items-center sm:gap-3 sm:rounded-xl sm:border sm:border-border/50 sm:bg-background/25 sm:p-3 sm:hover:border-primary/30"
              >
                <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col-reverse sm:block">
                  <span className="line-clamp-2 text-xs font-semibold leading-tight sm:block sm:truncate sm:text-sm">
                    {title}
                  </span>
                  <time
                    dateTime={occurrence.date}
                    className="mb-1 block text-[11px] font-medium capitalize text-primary sm:mb-0 sm:text-xs sm:text-muted-foreground"
                  >
                    {new Date(`${occurrence.date}T12:00:00`).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </time>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
