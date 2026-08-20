"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import {
  getUpcomingOccurrences,
  getClientLocalDate,
  getOccurrenceTitle,
  type CalendarOccurrence,
} from "@/lib/calendar/client-calendar";

const stripClass =
  "group inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-full border border-border/55 bg-[hsl(var(--surface-3)/0.6)] py-1.5 pl-3 pr-3.5 text-sm transition-[border-color,background-color] duration-200 hover:border-primary/45 hover:bg-[hsl(var(--surface-3)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Ближайшее событие живёт в шапке страницы одной строкой, а не отдельной
 * панелью: одна дата не оправдывает поверхность высотой в треть экрана,
 * а рядом с заголовком она читается как контекст, а не как отдельный раздел.
 */
export function UpcomingCalendarCard({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const today = getClientLocalDate();
  const through = `${Number(today.slice(0, 4)) + 1}-${today.slice(5)}`;
  const { data, isLoading, error, mutate } = useSWR<{ occurrences: CalendarOccurrence[] }>(
    `/api/calendar?from=${today}&to=${through}`,
    fetcher,
  );
  const nextOccurrence = getUpcomingOccurrences(data?.occurrences ?? [], today, 1)[0];

  if (isLoading) {
    return (
      <div className={cn(stripClass, "text-muted-foreground", className)} role="status">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
        <span className="sr-only">{t("Загрузка календаря")}</span>
        <span aria-hidden>{t("Ближайшее событие")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={() => void mutate()}
        className={cn(stripClass, "border-destructive/32 text-destructive", className)}
      >
        {t("Не удалось загрузить ближайшие события")}
        <span className="font-semibold text-foreground">{t("Повторить")}</span>
      </button>
    );
  }

  if (!nextOccurrence) {
    return (
      <Link href="/calendar" className={cn(stripClass, "text-muted-foreground", className)}>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
        <span className="min-w-0 truncate">{t("Ближайших событий пока нет")}</span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <Link
      href="/calendar"
      aria-label={`${t("Весь календарь")}: ${getOccurrenceTitle(nextOccurrence)}`}
      className={cn(stripClass, className)}
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <time
        dateTime={nextOccurrence.date}
        className="shrink-0 font-semibold tabular-nums text-primary"
      >
        {new Date(`${nextOccurrence.date}T12:00:00`).toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
        })}
      </time>
      <span aria-hidden className="h-3.5 w-px shrink-0 bg-border/70" />
      <span className="min-w-0 truncate text-foreground">{getOccurrenceTitle(nextOccurrence)}</span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-primary transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
