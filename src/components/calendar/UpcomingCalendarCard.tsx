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
  const nextOccurrence = getUpcomingOccurrences(data?.occurrences ?? [], today, 1)[0];

  return (
    <section
      className={cn(
        uiSurface.contentPanel,
        "calendar-preview-panel mb-3 overflow-hidden p-3 sm:mb-4 sm:p-5",
      )}
      aria-labelledby="upcoming-calendar-title"
    >
      <h2
        id="upcoming-calendar-title"
        className="px-1 text-sm font-semibold text-muted-foreground sm:text-base"
      >
        {t("Ближайшее событие")}
      </h2>

      {isLoading ? (
        <div className="flex min-h-14 items-center justify-center" role="status">
          <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none text-muted-foreground" />
          <span className="sr-only">{t("Загрузка календаря")}</span>
        </div>
      ) : error ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-destructive/25 px-1 pt-3">
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
      ) : !nextOccurrence ? (
        <Link
          href="/calendar"
          className="group mt-2 flex min-h-12 items-center justify-between gap-3 border-t border-border/38 px-1 pt-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
        >
          <span>{t("Ближайших событий пока нет")}</span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ) : (
        <Link
          href="/calendar"
          aria-label={`${t("Весь календарь")}: ${getOccurrenceTitle(nextOccurrence)}`}
          className="group mt-2 flex min-h-14 items-center gap-3 border-t border-border/38 px-1 pt-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
        >
          <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col-reverse">
            <span className="truncate text-sm font-semibold leading-tight">
              {getOccurrenceTitle(nextOccurrence)}
            </span>
            <time
              dateTime={nextOccurrence.date}
              className="mb-1 text-xs font-medium capitalize text-primary"
            >
              {new Date(`${nextOccurrence.date}T12:00:00`).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
              })}
            </time>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </section>
  );
}
