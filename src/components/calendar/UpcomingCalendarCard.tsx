"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { cn, fetcher } from "@/lib/utils";
import {
  getUpcomingOccurrences,
  getClientLocalDate,
  getOccurrenceTitle,
  type CalendarOccurrence,
} from "@/lib/calendar/client-calendar";

const stripClass =
  "group inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2))] px-3.5 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] transition-[border-color,background-color] duration-200 hover:bg-[hsl(var(--surface-3))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Ближайшее событие живёт в шапке страницы, а не отдельной панелью: одна
 * дата не оправдывает поверхность высотой в треть экрана, а рядом с
 * заголовком она читается как контекст, а не как отдельный раздел.
 *
 * Дата стоит плиткой «число над месяцем», а под названием — сколько
 * осталось: в строке-пилюле «7 окт. | День рождения мамы» число терялось
 * среди текста, а до события приходилось считать самому.
 */
export function UpcomingCalendarCard({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const today = getClientLocalDate();
  const through = `${Number(today.slice(0, 4)) + 1}-${today.slice(5)}`;
  const { data, isLoading, error, mutate } = useSWR<{ occurrences: CalendarOccurrence[] }>(
    `/api/calendar?from=${today}&to=${through}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
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
          className="h-4 w-4 shrink-0 text-primary-accent transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  const date = new Date(`${nextOccurrence.date}T12:00:00`);
  const daysUntil = Math.round((date.getTime() - Date.parse(`${today}T12:00:00`)) / 86_400_000);

  return (
    <Link
      href="/calendar"
      aria-label={`${t("Весь календарь")}: ${getOccurrenceTitle(nextOccurrence)}`}
      className={cn(
        stripClass,
        "w-full gap-3.5 py-2.5 pl-2.5 sm:w-auto sm:min-w-[22rem]",
        className,
      )}
    >
      <time
        dateTime={nextOccurrence.date}
        className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[hsl(var(--surface-4))] leading-none"
      >
        <span className="text-lg font-bold tabular-nums text-primary-accent">
          {date.toLocaleDateString(locale, { day: "numeric" })}
        </span>
        <span className="pt-1 text-[10px] font-semibold text-muted-foreground">
          {date.toLocaleDateString(locale, { month: "short" })}
        </span>
      </time>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold text-foreground">
          {getOccurrenceTitle(nextOccurrence)}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(daysUntil, "day")}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
