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
        "calendar-preview-panel mb-3 overflow-hidden p-3 sm:mb-4 sm:p-5",
      )}
      aria-labelledby="upcoming-calendar-title"
    >
      <div className="flex items-center justify-between gap-3 px-1">
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
          className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-xl pl-3 pr-1.5 text-sm font-semibold text-primary transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/9 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 sm:h-10 sm:px-3"
        >
          <span className="max-sm:sr-only">{t("Весь календарь")}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
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
        <div className="mt-3 grid grid-cols-[1.35fr_0.9fr] grid-rows-2 gap-px overflow-hidden rounded-xl bg-border/50 ring-1 ring-foreground/[0.035] sm:mt-4 sm:grid-cols-3 sm:grid-rows-1 sm:gap-2 sm:bg-transparent sm:ring-0">
          {upcoming.map((occurrence) => {
            const title = getOccurrenceTitle(occurrence);
            const isNext = occurrence.id === upcoming[0]?.id;
            return (
              <Link
                key={occurrence.id}
                href="/calendar"
                className={cn(
                  "group relative flex min-w-0 bg-[hsl(var(--surface-2))/0.9] transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[hsl(var(--surface-3))/0.96] active:scale-[0.985] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 sm:col-span-1 sm:row-span-1 sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:rounded-xl sm:border sm:border-border/50 sm:bg-background/25 sm:p-3 sm:hover:border-primary/30",
                  isNext
                    ? cn(
                        "row-span-2 flex-col justify-between p-3.5",
                        upcoming.length === 1 && "col-span-2",
                      )
                    : cn(
                        "flex-col justify-center gap-1 px-3 py-2.5",
                        upcoming.length === 2 && "row-span-2",
                      ),
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center bg-primary/10 text-primary",
                    isNext ? "h-9 w-9 rounded-xl" : "hidden",
                    "sm:flex sm:h-9 sm:w-9 sm:rounded-lg",
                  )}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </span>
                <span className={cn("flex min-w-0 flex-col-reverse sm:block", isNext && "mt-4 sm:mt-0")}>
                  <span
                    className={cn(
                      "line-clamp-2 font-semibold leading-tight sm:block sm:truncate sm:text-sm",
                      isNext ? "text-sm" : "text-xs",
                    )}
                  >
                    {title}
                  </span>
                  <time
                    dateTime={occurrence.date}
                    className={cn(
                      "mb-1 block font-medium capitalize text-primary sm:mb-0 sm:text-xs sm:text-muted-foreground",
                      isNext ? "text-xs" : "text-[11px]",
                    )}
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
