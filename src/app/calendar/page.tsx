"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarDays,
  ChevronRight,
  Clock3,
  Gift,
  History,
  LayoutList,
  Loader2,
  PartyPopper,
  BellOff,
} from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { UserAvatar } from "@/components/UserAvatar";
import { PersonalEventsPanel } from "@/components/calendar/PersonalEventsPanel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/fetcher";
import { capitalizeFirst, cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import {
  filterCalendarOccurrences,
  getCalendarSections,
  getClientLocalDate,
  getInitialCalendarView,
  getOccurrenceTitle,
  groupCalendarOccurrences,
  type CalendarFilter,
  type CalendarOccurrence,
  type CalendarView,
} from "@/lib/calendar/client-calendar";
import { thematicWishlistHref } from "@/lib/calendar/wishlist-link";

const FILTERS: Array<{ value: CalendarFilter; label: string }> = [
  { value: "ALL", label: "Все события" },
  { value: "BIRTHDAY", label: "Дни рождения" },
  { value: "HOLIDAY", label: "Общие праздники" },
  { value: "PERSONAL", label: "Личные события" },
];

function EventRow({
  occurrence,
  locale,
  t,
  muted,
  onToggleMuted,
}: {
  occurrence: CalendarOccurrence;
  locale: string;
  t: (value: string) => string;
  muted: boolean;
  onToggleMuted: () => void;
}) {
  const Icon =
    occurrence.type === "BIRTHDAY" ? Cake : occurrence.type === "HOLIDAY" ? PartyPopper : Clock3;
  const title = getOccurrenceTitle(occurrence);

  return (
    <article className="group flex gap-2 py-2.5 first:pt-0 last:pb-0 sm:gap-3 sm:py-3">
      {occurrence.type === "BIRTHDAY" ? (
        <UserAvatar
          avatarUrl={occurrence.person.avatarUrl}
          name={occurrence.person.name}
          userId={occurrence.person.id}
          size="lg"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:border sm:border-primary/20">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">
              {occurrence.type === "HOLIDAY"
                ? t("Общий праздник")
                : occurrence.type === "PERSONAL"
                  ? occurrence.recurrence === "YEARLY"
                    ? t("Личное событие · ежегодно")
                    : t("Личное событие")
                  : occurrence.isOwn
                    ? t("Ваш день рождения")
                    : t("День рождения")}
            </p>
          </div>
          <time
            dateTime={occurrence.date}
            className="shrink-0 text-sm font-medium text-muted-foreground max-sm:hidden"
          >
            {new Date(`${occurrence.date}T12:00:00`).toLocaleDateString(locale, {
              day: "numeric",
              month: "short",
            })}
          </time>
          <button
            type="button"
            onClick={onToggleMuted}
            aria-pressed={muted}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:min-h-9 sm:min-w-0",
              muted
                ? "border-primary/35 bg-primary/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:bg-accent",
            )}
          >
            <BellOff className="h-3.5 w-3.5" aria-hidden />
            <span className="max-sm:sr-only">
              {muted ? t("Напоминания выключены") : t("Не напоминать")}
            </span>
          </button>
        </div>

        {occurrence.type === "BIRTHDAY" && !occurrence.isOwn ? (
          <Link
            href={`/?userId=${occurrence.person.id}`}
            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-semibold transition-colors hover:border-primary/35 hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden />
            {t("Открыть вишлисты")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}

        {occurrence.type === "HOLIDAY" && occurrence.congratulated.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {occurrence.congratulated.flatMap((person) =>
              person.wishlists.map((wishlist) => (
                <Link
                  key={`${person.id}:${wishlist.id}`}
                  href={thematicWishlistHref(person.id, wishlist.id)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/60 bg-background/35 px-3 text-xs font-semibold transition-colors hover:border-primary/35 hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                >
                  {person.name}: {wishlist.name}
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )),
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MonthGrid({
  occurrences,
  year,
  month,
  locale,
  t,
}: {
  occurrences: CalendarOccurrence[];
  year: number;
  month: number;
  locale: string;
  t: (value: string) => string;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const groupedMonth = groupCalendarOccurrences(occurrences);
  const byDate = new Map(groupedMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: "short" }),
  );
  /** Сетка всегда закрывает последнюю неделю целиком, иначе месяц обрывается рваной строкой. */
  const trailingDays = (7 - ((leadingDays + daysInMonth) % 7)) % 7;
  const isWeekendColumn = (columnIndex: number) => columnIndex % 7 >= 5;

  return (
    <div
      className="overflow-x-auto pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
      role="region"
      aria-label={t("Месячная сетка календаря")}
      tabIndex={0}
    >
      <div className="min-w-0 sm:min-w-[42rem]" role="grid">
        <div className="grid grid-cols-7 border-b border-border/55" role="row">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-0.5 pb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75 sm:px-2 sm:pb-2 sm:text-left sm:text-xs"
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" role="rowgroup">
          {Array.from({ length: leadingDays }, (_, index) => (
            <div
              key={`empty-lead:${index}`}
              className={cn(
                "min-h-14 border-b border-r border-border/35 bg-[hsl(var(--surface-1)/0.45)] sm:min-h-28",
                isWeekendColumn(index) && "bg-[hsl(var(--surface-1)/0.7)]",
              )}
              role="gridcell"
              aria-hidden
            />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const entries = byDate.get(date) ?? [];
            const isToday = date === getClientLocalDate();
            return (
              <div
                key={date}
                className={cn(
                  "min-h-14 border-b border-r border-border/35 p-1 transition-colors duration-[var(--dur-base)] sm:min-h-28 sm:p-2",
                  isWeekendColumn(leadingDays + index) && "bg-[hsl(var(--surface-1)/0.4)]",
                  entries.length > 0 && "bg-primary/[0.05]",
                  isToday && "bg-primary/[0.08]",
                )}
                role="gridcell"
                aria-label={[
                  new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                  ...entries.map(getOccurrenceTitle),
                ].join(", ")}
              >
                <time
                  dateTime={date}
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-semibold sm:h-7 sm:min-w-7 sm:rounded-lg sm:px-1.5 sm:text-sm",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day}
                </time>
                <div className="mt-1 flex min-h-2 flex-wrap items-center gap-0.5 sm:mt-1.5 sm:block sm:space-y-1">
                  {entries.slice(0, 3).map((entry) => {
                    const href =
                      entry.type === "BIRTHDAY" && !entry.isOwn
                        ? `/?userId=${entry.person.id}`
                        : entry.type === "HOLIDAY" && entry.congratulated[0]?.wishlists[0]
                          ? thematicWishlistHref(
                              entry.congratulated[0].id,
                              entry.congratulated[0].wishlists[0].id,
                            )
                          : null;
                    const className = cn(
                      "block truncate rounded-md px-1.5 py-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55",
                      entry.type === "BIRTHDAY" && "bg-info/14 text-info",
                      entry.type === "HOLIDAY" && "bg-primary/12 text-primary",
                      entry.type === "PERSONAL" && "bg-success/12 text-success",
                    );
                    const dotClassName = cn(
                      "inline-block h-1.5 w-1.5 shrink-0 rounded-full ring-2 ring-background sm:hidden",
                      entry.type === "BIRTHDAY" && "bg-info",
                      entry.type === "HOLIDAY" && "bg-primary",
                      entry.type === "PERSONAL" && "bg-success",
                    );
                    return (
                      <span key={entry.id}>
                        <span className={dotClassName} aria-hidden />
                        {href ? (
                          <Link
                            href={href}
                            title={getOccurrenceTitle(entry)}
                            className={cn(className, "max-sm:hidden")}
                          >
                            {getOccurrenceTitle(entry)}
                          </Link>
                        ) : (
                          <span
                            title={getOccurrenceTitle(entry)}
                            className={cn(className, "max-sm:hidden")}
                          >
                            {getOccurrenceTitle(entry)}
                          </span>
                        )}
                      </span>
                    );
                  })}
                  {entries.length > 3 ? (
                    <p className="px-0.5 text-[9px] font-semibold text-muted-foreground sm:px-1 sm:text-[11px]">
                      {t("Ещё")}: {entries.length - 3}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
          {Array.from({ length: trailingDays }, (_, index) => (
            <div
              key={`empty-trail:${index}`}
              className={cn(
                "min-h-14 border-b border-r border-border/35 bg-[hsl(var(--surface-1)/0.45)] sm:min-h-28",
                isWeekendColumn(leadingDays + daysInMonth + index) &&
                  "bg-[hsl(var(--surface-1)/0.7)]",
              )}
              role="gridcell"
              aria-hidden
            />
          ))}
        </div>
      </div>
      {groupedMonth.length > 0 ? (
        <div className="mt-3 border-t border-border/45 pt-3 sm:hidden">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
            {t("События месяца")}
          </h3>
          <div className="space-y-1">
            {groupedMonth.flatMap(([date, entries]) =>
              entries.map((entry) => {
                const href =
                  entry.type === "BIRTHDAY" && !entry.isOwn
                    ? `/?userId=${entry.person.id}`
                    : entry.type === "HOLIDAY" && entry.congratulated[0]?.wishlists[0]
                      ? thematicWishlistHref(
                          entry.congratulated[0].id,
                          entry.congratulated[0].wishlists[0].id,
                        )
                      : null;
                const content = (
                  <>
                    <time
                      dateTime={date}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/9 text-xs font-semibold text-primary"
                    >
                      {Number(date.slice(-2))}
                    </time>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {getOccurrenceTitle(entry)}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        entry.type === "BIRTHDAY" && "bg-info",
                        entry.type === "HOLIDAY" && "bg-primary",
                        entry.type === "PERSONAL" && "bg-success",
                      )}
                      aria-hidden
                    />
                  </>
                );
                const itemClassName =
                  "flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55";
                return href ? (
                  <Link
                    key={`${date}:${entry.id}`}
                    href={href}
                    className={cn(itemClassName, "hover:bg-primary/7")}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={`${date}:${entry.id}`} className={itemClassName}>
                    {content}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      ) : null}
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
  const [view, setView] = useState<CalendarView>("month");
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data, isLoading, error, mutate } = useSWR<{
    occurrences: CalendarOccurrence[];
  }>(`/api/calendar?from=${year}-01-01&to=${year + 1}-12-31`, fetcher);
  const { data: muteData, mutate: mutateMutes } = useSWR<{
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
  const groupedUpcoming = useMemo(() => groupCalendarOccurrences(upcoming), [upcoming]);
  const monthOccurrences = filtered.filter((occurrence) =>
    occurrence.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  );
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    setView(getInitialCalendarView(window.matchMedia("(max-width: 767px)").matches));
  }, []);

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function reminderKey(occurrence: CalendarOccurrence): string {
    const sourceId =
      occurrence.type === "PERSONAL"
        ? occurrence.sourceId
        : occurrence.type === "BIRTHDAY"
          ? occurrence.person.id
          : occurrence.id.split(":")[1];
    return `${occurrence.type}:${sourceId}`;
  }

  async function toggleReminderMute(occurrence: CalendarOccurrence) {
    const key = reminderKey(occurrence);
    const muted = muteData?.mutedEventKeys.includes(key) ?? false;
    await fetch("/api/calendar/reminder-mutes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: occurrence.type,
        sourceId: key.slice(key.indexOf(":") + 1),
        muted: !muted,
      }),
    });
    await mutateMutes();
  }

  return (
    <PageShell>
      <PageMain>
        {/* Extension of the existing product world: a scan-first planning surface,
            not a decorative calendar. The list leads on mobile; month context leads
            on wide screens. Filters and history stay visible without hiding tasks. */}
        <div className="space-y-4">
          <PageIntro
            title={t("Календарь")}
            description={t("Планируйте внимание и подарки к значимым датам")}
          />

          <section aria-label={t("Управление календарём")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] max-sm:hidden [&::-webkit-scrollbar]:hidden"
                aria-label={t("Фильтры календаря")}
              >
                {FILTERS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={filter === option.value ? "glassActive" : "ghost"}
                    size="sm"
                    className="shrink-0"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  >
                    {t(option.label)}
                  </Button>
                ))}
              </div>
              <div className="grid gap-1 sm:hidden">
                <span className="text-xs font-medium text-muted-foreground">{t("Фильтр")}</span>
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as CalendarFilter)}
                >
                  <SelectTrigger aria-label={t("Фильтр")} className="h-11 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-border/55 p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "list" ? "glassActive" : "ghost"}
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                    {t("Список")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "month" ? "glassActive" : "ghost"}
                    aria-pressed={view === "month"}
                    onClick={() => setView("month")}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {t("Месяц")}
                  </Button>
                </div>
                <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                  <SelectTrigger
                    aria-label={t("Год")}
                    className="h-9 w-auto gap-2 tabular-nums max-sm:h-11"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <PersonalEventsPanel />

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center" role="status">
              <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none text-muted-foreground" />
              <span className="sr-only">{t("Загрузка календаря")}</span>
            </div>
          ) : error ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" />}
              title={t("Не удалось загрузить календарь")}
              description={t("Попробуйте загрузить события ещё раз")}
              actionLabel={t("Повторить")}
              onAction={() => void mutate()}
            />
          ) : view === "month" ? (
            <section className={cn(uiSurface.contentPanel, "overflow-hidden p-2.5 sm:p-4")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => changeMonth(-1)}
                  aria-label={t("Предыдущий месяц")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="section-title">{capitalizeFirst(monthLabel, locale)}</h2>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => changeMonth(1)}
                  aria-label={t("Следующий месяц")}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <MonthGrid
                occurrences={monthOccurrences}
                year={year}
                month={month}
                locale={locale}
                t={t}
              />
              {monthOccurrences.length === 0 ? (
                <p className="border-t border-border/45 py-5 text-center text-sm text-muted-foreground">
                  {t("В этом месяце событий нет")}
                </p>
              ) : null}
            </section>
          ) : groupedUpcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" />}
              title={t("Нет ближайших событий")}
              description={t("Измените фильтр или добавьте личное событие")}
            />
          ) : (
            <div className="space-y-3">
              {groupedUpcoming.map(([date, entries]) => (
                <section key={date} className={cn(uiSurface.contentPanel, "p-3 sm:p-5")}>
                  <h2 className="mb-2 text-xs font-semibold text-muted-foreground sm:mb-3 sm:text-sm">
                    {capitalizeFirst(
                      new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        weekday: "long",
                      }),
                      locale,
                    )}
                  </h2>
                  <div className="divide-y divide-border/55">
                    {entries.map((entry) => (
                      <EventRow
                        key={entry.id}
                        occurrence={entry}
                        locale={locale}
                        t={t}
                        muted={muteData?.mutedEventKeys.includes(reminderKey(entry)) ?? false}
                        onToggleMuted={() => void toggleReminderMute(entry)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {history.length > 0 ? (
            <section className={cn(uiSurface.contentPanel, "p-4 sm:p-5")}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((open) => !open)}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <History className="h-4 w-4 text-muted-foreground" />
                  {t("История")}
                </span>
                <span className="text-sm text-muted-foreground">{history.length}</span>
              </button>
              {historyOpen ? (
                <div className="mt-3 divide-y divide-border/55 border-t border-border/55 pt-3">
                  {history.map((entry) => (
                    <EventRow
                      key={entry.id}
                      occurrence={entry}
                      locale={locale}
                      t={t}
                      muted={muteData?.mutedEventKeys.includes(reminderKey(entry)) ?? false}
                      onToggleMuted={() => void toggleReminderMute(entry)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </PageMain>
    </PageShell>
  );
}
