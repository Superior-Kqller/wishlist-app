"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { UserAvatar } from "@/components/UserAvatar";
import { cn, fetcher } from "@/lib/utils";
import {
  getUpcomingOccurrences,
  getClientLocalDate,
  getOccurrenceTitle,
  type CalendarOccurrence,
} from "@/lib/calendar/client-calendar";

// Компактная пилюля в строке «чей список» на главной (DESIGN.md → «Чипы»).
const stripClass =
  "group inline-flex h-11 max-w-full items-center gap-2 rounded-full border border-border bg-background pl-3.5 pr-3 text-sm transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Ближайшие поводы на год вперёд — один запрос на всю главную (SWR склеит соседей). */
export function useUpcomingOccurrences() {
  const today = getClientLocalDate();
  const through = `${Number(today.slice(0, 4)) + 1}-${today.slice(5)}`;
  const query = useSWR<{ occurrences: CalendarOccurrence[] }>(
    `/api/calendar?from=${today}&to=${through}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );
  return { ...query, today };
}

export function daysBetween(today: string, date: string) {
  return Math.round(
    (Date.parse(`${date}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86_400_000,
  );
}

/**
 * Ближайший повод — пилюлей справа в строке людей на главной.
 *
 * Если повод — день рождения человека из круга, пилюля ведёт к его списку,
 * а не в календарь: от даты человек идёт выбирать подарок. Точка `brand` —
 * единственный фирменный знак повода (DESIGN.md → «Цвет»).
 */
export function UpcomingCalendarCard({
  currentUserId,
  className,
}: {
  currentUserId?: string;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const { data, isLoading, error, mutate, today } = useUpcomingOccurrences();
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
        className={cn(stripClass, "text-muted-foreground", className)}
      >
        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
        {t("Поводы не загрузились")}
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
          className="h-4 w-4 shrink-0 text-foreground transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  const date = new Date(`${nextOccurrence.date}T12:00:00`);
  const daysUntil = daysBetween(today, nextOccurrence.date);
  const person =
    nextOccurrence.type === "BIRTHDAY" && nextOccurrence.person.id !== currentUserId
      ? nextOccurrence.person
      : null;
  const title = getOccurrenceTitle(nextOccurrence);
  const href = person ? `/?userId=${person.id}` : "/calendar";
  const when = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(daysUntil, "day");

  return (
    <Link
      href={href}
      aria-label={
        person
          ? `${t("День рождения")}: ${title}, ${when}. ${t("Открыть список")}`
          : `${title}, ${when}. ${t("Весь календарь")}`
      }
      className={cn(stripClass, className)}
    >
      <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
      <time dateTime={nextOccurrence.date} className="shrink-0 font-semibold tabular-nums">
        {date.toLocaleDateString(locale, { day: "numeric", month: "short" }).replace(".", "")}
      </time>
      {person ? (
        <span className="pointer-events-none shrink-0">
          <UserAvatar
            avatarUrl={person.avatarUrl}
            name={person.name}
            userId={person.id}
            size="sm"
          />
        </span>
      ) : null}
      <span className="min-w-0 truncate font-medium">{title}</span>
      <span className="shrink-0 whitespace-nowrap text-muted-foreground">· {when}</span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </Link>
  );
}
