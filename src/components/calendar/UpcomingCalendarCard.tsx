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

const stripClass =
  "group inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2))] px-3.5 py-2 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)] transition-[border-color,background-color] duration-200 hover:border-primary-accent/45 hover:bg-[hsl(var(--surface-3))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
 * Ближайший повод — в строке заголовка главной.
 *
 * Если повод — день рождения человека из круга, карточка ведёт к его списку,
 * а не в календарь: от даты человек идёт выбирать подарок, и календарь был
 * лишним шагом. Число набрано антиквой — это «листок календаря», единственная
 * цифра в продукте, которой разрешён голос заголовка.
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
          className="h-4 w-4 shrink-0 text-primary-accent transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5"
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
      className={cn(
        stripClass,
        "w-full gap-3.5 py-2.5 pl-2.5 sm:w-auto sm:min-w-[20rem]",
        className,
      )}
    >
      <time
        dateTime={nextOccurrence.date}
        className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[hsl(var(--surface-4))] leading-none"
      >
        <span className="display-face text-[1.375rem] tabular-nums text-primary-accent">
          {date.toLocaleDateString(locale, { day: "numeric" })}
        </span>
        <span className="pt-0.5 text-[10px] font-semibold text-muted-foreground">
          {date.toLocaleDateString(locale, { month: "short" })}
        </span>
      </time>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
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
          <span className="truncate text-[15px] font-semibold text-foreground">{title}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {person ? `${t("День рождения")} · ${when}` : when}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-expo)] group-hover:translate-x-0.5 group-hover:text-primary-accent"
        aria-hidden
      />
    </Link>
  );
}
