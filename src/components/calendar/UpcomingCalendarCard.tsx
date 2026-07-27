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
        "mb-4 overflow-hidden p-4 sm:p-5",
      )}
      aria-labelledby="upcoming-calendar-title"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="upcoming-calendar-title" className="font-semibold">
            {t("Ближайшие события")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("Три следующих доступных вам события")}
          </p>
        </div>
        <Link
          href="/calendar"
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
        >
          {t("Весь календарь")}
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
        <p className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-5 text-sm text-muted-foreground">
          {t("Ближайших событий пока нет")}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {upcoming.map((occurrence) => {
            const title = getOccurrenceTitle(occurrence);
            return (
              <Link
                key={occurrence.id}
                href="/calendar"
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/50 bg-background/25 p-3 transition-colors hover:border-primary/30 hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{title}</span>
                  <time
                    dateTime={occurrence.date}
                    className="block text-xs capitalize text-muted-foreground"
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
