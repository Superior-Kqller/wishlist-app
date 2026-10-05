"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  Cake,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Gift,
  History,
  PartyPopper,
} from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { PersonalEventsPanel } from "@/components/calendar/PersonalEventsPanel";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { RetryNotice } from "@/components/ui/retry-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageMain, PageShell } from "@/components/ui/page-shell";
import { SegmentGlide } from "@/components/ui/segment-glide";
import { capitalizeFirst, cn, fetcher } from "@/lib/utils";
import { uiLayout } from "@/lib/ui-contract";
import {
  filterCalendarOccurrences,
  getCalendarSections,
  getClientLocalDate,
  getOccurrenceTitle,
  groupCalendarOccurrences,
  thematicWishlistHref,
  type CalendarFilter,
  type CalendarOccurrence,
} from "@/lib/calendar/client-calendar";
import { formatLocalDate } from "@/lib/calendar/local-date";
import { occurrenceReminderKey } from "@/lib/calendar/reminder-event-key";
import { responseError } from "@/lib/response-error";

const FILTERS: Array<{ value: CalendarFilter; label: string }> = [
  { value: "ALL", label: "Все события" },
  { value: "BIRTHDAY", label: "Дни рождения" },
  { value: "HOLIDAY", label: "Общие праздники" },
  { value: "PERSONAL", label: "Личные события" },
];

/** Тип события несёт иконка и подпись, а не цвет. */
const EVENT_TYPE_META = {
  BIRTHDAY: { icon: Cake, label: "День рождения" },
  HOLIDAY: { icon: PartyPopper, label: "Общий праздник" },
  PERSONAL: { icon: Clock3, label: "Личное событие" },
} as const;

/** «через 12 дней», «завтра», «3 дня назад». */
function relativeDays(date: string, today: string, locale: string) {
  const days = Math.round(
    (Date.parse(`${date}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86_400_000,
  );
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(days, "day");
}

function typeLabel(occurrence: CalendarOccurrence, t: (value: string) => string) {
  if (occurrence.type === "PERSONAL") {
    return occurrence.recurrence === "YEARLY"
      ? t("Личное событие · ежегодно")
      : t("Личное событие");
  }
  if (occurrence.type === "BIRTHDAY" && occurrence.isOwn) return t("Ваш день рождения");
  return t(EVENT_TYPE_META[occurrence.type].label);
}

/** Плитка даты: крупное число над днём недели. */
function DateTile({ date, locale }: { date: string; locale: string }) {
  const value = new Date(`${date}T12:00:00`);
  return (
    <time
      dateTime={date}
      className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[hsl(var(--surface-3))] leading-none"
    >
      <span className="text-xl font-bold tabular-nums">{value.getDate()}</span>
      <span className="pt-1 text-xs font-medium text-muted-foreground">
        {value.toLocaleDateString(locale, { weekday: "short" })}
      </span>
    </time>
  );
}

const pillLinkClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function EventRow({
  occurrence,
  today,
  locale,
  t,
  muted,
  highlighted,
  onToggleMuted,
}: {
  occurrence: CalendarOccurrence;
  today: string;
  locale: string;
  t: (value: string) => string;
  muted: boolean;
  highlighted: boolean;
  onToggleMuted: () => void;
}) {
  const title = getOccurrenceTitle(occurrence);
  const TypeIcon = EVENT_TYPE_META[occurrence.type].icon;
  const person = occurrence.type === "BIRTHDAY" ? occurrence.person : null;

  return (
    <article
      data-date={occurrence.date}
      className={cn(
        // Скругление — только у подсвеченной строки: у остальных оно загибало
        // концы разделителя `divide-y` дугой.
        "flex scroll-mt-28 gap-4 px-2 py-4 transition-colors duration-[var(--dur-base)]",
        highlighted && "rounded-xl bg-accent",
      )}
    >
      <DateTile date={occurrence.date} locale={locale} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2 text-base font-semibold">
              {person ? (
                <UserAvatar
                  avatarUrl={person.avatarUrl}
                  name={person.name}
                  userId={person.id}
                  size="sm"
                />
              ) : null}
              <span className="line-clamp-2">{title}</span>
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              <TypeIcon className="size-3.5 shrink-0" aria-hidden />
              <span>{typeLabel(occurrence, t)}</span>
              {/*
               * На телефоне тип и срок вместе не влезают рядом с колокольчиком,
               * и точка-разделитель повисала в конце строки. Там срок — своя
               * строка без точки, и все строки ленты одной высоты.
               */}
              <span aria-hidden className="max-sm:hidden">
                ·
              </span>
              <span className="max-sm:basis-full">
                {relativeDays(occurrence.date, today, locale)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleMuted}
            aria-pressed={muted}
            aria-label={muted ? t("Напоминания выключены") : t("Не напоминать")}
            title={muted ? t("Напоминания выключены") : t("Не напоминать")}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              muted
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {muted ? (
              <BellOff className="size-4" aria-hidden />
            ) : (
              <Bell className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {occurrence.type === "BIRTHDAY" && !occurrence.isOwn ? (
          <Link href={`/?userId=${occurrence.person.id}`} className={cn(pillLinkClass, "mt-3")}>
            <Gift className="size-4" aria-hidden />
            {t("Открыть вишлисты")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}

        {occurrence.type === "HOLIDAY" && occurrence.congratulated.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {occurrence.congratulated.flatMap((congratulated) =>
              congratulated.wishlists.map((wishlist) => (
                <Link
                  key={`${congratulated.id}:${wishlist.id}`}
                  href={thematicWishlistHref(congratulated.id, wishlist.id)}
                  className={cn(pillLinkClass, "pl-1.5")}
                >
                  <UserAvatar
                    avatarUrl={congratulated.avatarUrl}
                    name={congratulated.name}
                    userId={congratulated.id}
                    size="sm"
                  />
                  {congratulated.name}: {wishlist.name}
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              )),
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Мини-календарь правой колонки — по DESIGN.md → «Календарь» и анатомии HeroUI
 * Calendar: шапка (месяц и стрелки), дни недели, шесть недель всегда (высота не
 * прыгает при листании). Дни — круги 40px; сегодня — кольцо чернилами; день с
 * поводом — точка `brand` и кнопка, которая ведёт к нему в ленте.
 */
function MiniMonth({
  year,
  month,
  eventDates,
  today,
  selectedDate,
  locale,
  t,
  onSelectDate,
  onChangeMonth,
  onToday,
}: {
  year: number;
  month: number;
  eventDates: Map<string, number>;
  today: string;
  selectedDate: string | null;
  locale: string;
  t: (value: string) => string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onToday: () => void;
}) {
  const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
  const start = new Date(year, month, 1 - leadingDays);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const value = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      date: formatLocalDate(value.getFullYear(), value.getMonth() + 1, value.getDate()),
      day: value.getDate(),
      inMonth: value.getMonth() === month,
    };
  });
  const weeks = Array.from({ length: 6 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: "short" }),
  );
  const currentMonthKey = today.slice(0, 7);
  const shownMonthKey = formatLocalDate(year, month + 1, 1).slice(0, 7);
  const monthLabel = capitalizeFirst(
    new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" }),
    locale,
  ).replace(/\s?г\.$/, "");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onChangeMonth(-1)}
          aria-label={t("Предыдущий месяц")}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base font-semibold" aria-live="polite">
            {monthLabel}
          </h2>
          {shownMonthKey !== currentMonthKey ? (
            <button
              type="button"
              onClick={onToday}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("Сегодня")}
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onChangeMonth(1)}
          aria-label={t("Следующий месяц")}
        >
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>

      <table
        className="w-full table-fixed border-collapse"
        aria-label={t("Месячная сетка календаря")}
      >
        <thead>
          <tr>
            {weekdayLabels.map((label) => (
              <th
                key={label}
                scope="col"
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].date}>
              {week.map(({ date, day, inMonth }) => {
                const count = eventDates.get(date) ?? 0;
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const circle = cn(
                  "relative mx-auto flex size-10 items-center justify-center rounded-full text-sm tabular-nums",
                  isToday && !isSelected && "ring-1 ring-inset ring-foreground",
                  isSelected && "bg-foreground text-background",
                );
                const dot =
                  count > 0 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                        isSelected ? "bg-background" : "bg-brand",
                      )}
                    />
                  ) : null;
                return (
                  <td key={date} className="p-0.5 text-center">
                    {inMonth && count > 0 ? (
                      <button
                        type="button"
                        onClick={() => onSelectDate(date)}
                        data-today={isToday || undefined}
                        data-selected={isSelected || undefined}
                        aria-pressed={isSelected}
                        aria-label={`${new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                        })}: ${count}`}
                        className={cn(
                          circle,
                          "font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "hover:bg-foreground",
                        )}
                      >
                        {day}
                        {dot}
                      </button>
                    ) : (
                      <span
                        data-today={isToday || undefined}
                        data-outside-month={!inMonth || undefined}
                        className={cn(
                          circle,
                          inMonth ? "text-foreground" : "text-muted-foreground/60",
                        )}
                      >
                        {day}
                        {inMonth ? dot : null}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="space-y-6" role="status">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-2">
          <Skeleton className="size-14 rounded-xl" />
          <div className="flex-1 space-y-2 pt-1.5">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const today = getClientLocalDate();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7)) - 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState<CalendarFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data, isLoading, error, mutate } = useSWR<{
    occurrences: CalendarOccurrence[];
  }>(`/api/calendar?from=${year}-01-01&to=${year + 1}-12-31`, fetcher);
  // Ошибка загрузки мьютов читается: иначе заглушённое событие выглядело бы активным.
  const {
    data: muteData,
    error: muteError,
    mutate: mutateMutes,
  } = useSWR<{
    mutedEventKeys: string[];
  }>("/api/calendar/reminder-mutes", fetcher);

  const filtered = useMemo(
    () => filterCalendarOccurrences(data?.occurrences ?? [], filter),
    [data?.occurrences, filter],
  );
  const { upcoming, history } = useMemo(
    () => getCalendarSections(filtered, today),
    [filtered, today],
  );
  const agenda = useMemo(() => groupCalendarOccurrences(upcoming, "month"), [upcoming]);
  const eventDates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const occurrence of filtered) {
      counts.set(occurrence.date, (counts.get(occurrence.date) ?? 0) + 1);
    }
    return counts;
  }, [filtered]);

  const isMuted = (occurrence: CalendarOccurrence) =>
    muteData?.mutedEventKeys.includes(occurrenceReminderKey(occurrence)) ?? false;

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  /** День в мини-календаре ведёт к его строке в ленте (прошлое — в истории). */
  function selectDate(date: string) {
    setSelectedDate(date);
    if (date < today) setHistoryOpen(true);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-agenda] [data-date="${date}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /*
   * Ответ проверяется, отказ называется вслух: иначе человек, пришедший
   * заглушить болезненную дату, остался бы в уверенности, что заглушил.
   */
  async function toggleReminderMute(occurrence: CalendarOccurrence) {
    const muted = isMuted(occurrence);
    try {
      const res = await fetch("/api/calendar/reminder-mutes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: occurrence.type,
          sourceId: occurrence.sourceId,
          muted: !muted,
        }),
      });
      if (!res.ok) throw await responseError(res, t("Не удалось изменить напоминания"));
      toast.success(muted ? t("Напоминания включены") : t("Напоминания выключены"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось изменить напоминания"));
    } finally {
      await mutateMutes();
    }
  }

  const renderRow = (occurrence: CalendarOccurrence) => (
    <EventRow
      key={`${occurrence.id}:${occurrence.date}`}
      occurrence={occurrence}
      today={today}
      locale={locale}
      t={t}
      muted={isMuted(occurrence)}
      highlighted={occurrence.date === selectedDate}
      onToggleMuted={() => void toggleReminderMute(occurrence)}
    />
  );

  return (
    <PageShell>
      <PageMain>
        {/* Раздел называет верхняя панель; видимого заголовка нет, как на главной. */}
        <h1 className="sr-only">{t("Календарь")}</h1>

        <div
          className={cn(
            uiLayout.segmentBarInline,
            "mb-8 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            /*
             * На телефоне четыре сегмента не влезают в рельсу, и она резала
             * подпись посреди слова. Там это ряд чипов до края экрана, как лица
             * на главной: обрезанный чип у края читается как «листай дальше».
             */
            "max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:max-w-none max-sm:gap-2 max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:px-4 max-sm:py-0",
          )}
          role="group"
          aria-label={t("Фильтры календаря")}
        >
          <SegmentGlide />
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filter === option.value ? "segmentActive" : "ghost"}
              size="sm"
              className="shrink-0 max-sm:rounded-full max-sm:border max-sm:border-border"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {t(option.label)}
            </Button>
          ))}
        </div>

        {muteError ? (
          <RetryNotice className="mb-6" onRetry={() => void mutateMutes()}>
            {t("Не удалось загрузить состояние напоминаний.")}
          </RetryNotice>
        ) : null}

        {/*
         * Детальный вид по DESIGN.md: слева лента поводов — главное, отсюда идут
         * к вишлистам; справа липкая колонка с мини-календарём и своими
         * событиями. На узком экране колонка уходит под ленту.
         */}
        <div className="grid gap-10 min-[1128px]:grid-cols-[minmax(0,1fr)_22rem] min-[1128px]:gap-12">
          <div className="min-w-0" data-agenda>
            {isLoading ? (
              <AgendaSkeleton />
            ) : error ? (
              <EmptyState
                icon={<CalendarDays aria-hidden />}
                title={t("Не удалось загрузить календарь")}
                description={t("Попробуйте загрузить события ещё раз")}
                actionLabel={t("Повторить")}
                onAction={() => void mutate()}
              />
            ) : agenda.length === 0 ? (
              <EmptyState
                icon={<CalendarDays aria-hidden />}
                title={t("Нет ближайших событий")}
                description={t("Измените фильтр или добавьте личное событие")}
              />
            ) : (
              // Skeleton to Content (kinetics): список сменяет скелетон, всплывая на 8px.
              <div className="space-y-10" data-reveal>
                {agenda.map(([monthKey, entries]) => (
                  <section key={monthKey} aria-labelledby={`agenda-${monthKey}`}>
                    <h2 id={`agenda-${monthKey}`} className="section-title mb-2 px-2">
                      {capitalizeFirst(
                        new Date(`${monthKey}-01T12:00:00`).toLocaleDateString(locale, {
                          month: "long",
                          ...(monthKey.slice(0, 4) === String(currentYear)
                            ? {}
                            : { year: "numeric" }),
                        }),
                        locale,
                      ).replace(/\s?г\.$/, "")}
                    </h2>
                    <div className="divide-y divide-border">{entries.map(renderRow)}</div>
                  </section>
                ))}
              </div>
            )}

            {history.length > 0 ? (
              <section className="mt-10 border-t border-border pt-4">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-expanded={historyOpen}
                  aria-controls="calendar-history-panel"
                  onClick={() => setHistoryOpen((open) => !open)}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <History className="size-4 text-muted-foreground" aria-hidden />
                    {t("История")}
                    <span className="text-sm font-normal text-muted-foreground tabular-nums">
                      {history.length}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "accordion-chevron size-4 text-muted-foreground",
                      historyOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                <div
                  id="calendar-history-panel"
                  className="accordion-body"
                  data-open={historyOpen ? "" : undefined}
                  inert={!historyOpen}
                >
                  <div className="divide-y divide-border">{history.map(renderRow)}</div>
                </div>
              </section>
            ) : null}
          </div>

          <aside
            className="space-y-6 min-[1128px]:sticky min-[1128px]:top-24 min-[1128px]:self-start"
            aria-label={t("Календарь")}
          >
            <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-float)]">
              <MiniMonth
                year={year}
                month={month}
                eventDates={eventDates}
                today={today}
                selectedDate={selectedDate}
                locale={locale}
                t={t}
                onSelectDate={selectDate}
                onChangeMonth={changeMonth}
                onToday={() => {
                  setYear(currentYear);
                  setMonth(currentMonth);
                }}
              />
            </div>
            <PersonalEventsPanel />
          </aside>
        </div>
      </PageMain>
    </PageShell>
  );
}
