"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
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
import { RetryNotice } from "@/components/ui/retry-notice";
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
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
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
import { occurrenceReminderKey } from "@/lib/calendar/reminder-event-key";
import { thematicWishlistHref } from "@/lib/calendar/wishlist-link";

const FILTERS: Array<{ value: CalendarFilter; label: string }> = [
  { value: "ALL", label: "Все события" },
  { value: "BIRTHDAY", label: "Дни рождения" },
  { value: "HOLIDAY", label: "Общие праздники" },
  { value: "PERSONAL", label: "Личные события" },
];

/**
 * Тип события несёт форма и подпись, а не цвет.
 *
 * Раньше в ячейке сетки и в мобильном списке тип кодировался только цветной
 * точкой с `aria-hidden`: скринридер не слышал её вовсе, а при дальтонизме
 * синий и циан не различались. Заодно текст чипа красился в тот же оттенок
 * поверх его же заливки — в светлой теме это давало 2.22:1 при норме 4.5.
 * Теперь текст всегда `foreground`, тип называет иконка и доступное имя,
 * а цвет остался усилением.
 */
const EVENT_TYPE_META = {
  BIRTHDAY: { icon: Cake, label: "День рождения", chip: "bg-info/16" },
  HOLIDAY: { icon: PartyPopper, label: "Общий праздник", chip: "bg-primary/16" },
  PERSONAL: { icon: Clock3, label: "Личное событие", chip: "bg-success/16" },
} as const;

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
  const Icon = EVENT_TYPE_META[occurrence.type].icon;
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:border sm:border-primary/24">
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
              "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9 sm:min-w-0",
              muted
                ? "border-primary/32 bg-primary/10 text-foreground"
                : "border-border/55 text-muted-foreground hover:bg-accent",
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
            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/55 px-3 text-xs font-semibold transition-colors hover:border-primary/32 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/55 bg-background/32 px-3 text-xs font-semibold transition-colors hover:border-primary/32 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  /*
   * Ячейки собираются в настоящие недели.
   *
   * Раньше `role="rowgroup"` содержал 28–42 `role="cell"` напрямую, без единого
   * `role="row"`. Такая таблица невалидна: в табличном режиме NVDA и JAWS не
   * могут ни посчитать строки, ни ходить по неделям стрелками. Полуфабрикат
   * хуже обоих вариантов — либо честные строки, либо никакой ARIA.
   */
  const cells: Array<{ key: string; date: string | null }> = [
    ...Array.from({ length: leadingDays }, (_, index) => ({
      key: `empty-lead:${index}`,
      date: null,
    })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { key: date, date };
    }),
    ...Array.from({ length: trailingDays }, (_, index) => ({
      key: `empty-trail:${index}`,
      date: null,
    })),
  ];
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );
  const isWeekendColumn = (columnIndex: number) => columnIndex >= 5;

  return (
    <div
      className="overflow-x-auto pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="region"
      aria-label={t("Месячная сетка календаря")}
      tabIndex={0}
    >
      <div className="min-w-0 md:min-w-[42rem]" role="table">
        <div className="grid grid-cols-7 border-b border-border/55" role="row">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              // На ступени `micro` подпись не уходит светлее `--muted-foreground`
              // (DESIGN.md → The Micro Floor Rule): десять пикселей самым тихим
              // полутоном — это две причины быть нечитаемым сразу.
              className="px-0.5 pb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-2 md:pb-2 md:text-left md:text-xs"
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        <div role="rowgroup">
          {weeks.map((week, weekIndex) => (
            <div key={`week:${weekIndex}`} className="grid grid-cols-7" role="row">
              {week.map(({ key, date }, columnIndex) => {
                if (!date) {
                  return (
                    <div
                      key={key}
                      className={cn(
                        "min-h-14 border-b border-r border-border/32 bg-[hsl(var(--surface-1)/0.45)] md:min-h-28",
                        isWeekendColumn(columnIndex) && "bg-[hsl(var(--surface-1)/0.7)]",
                      )}
                      role="cell"
                    />
                  );
                }
                const day = Number(date.slice(-2));
                const entries = byDate.get(date) ?? [];
                const isToday = date === getClientLocalDate();
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-14 border-b border-r border-border/32 p-1 transition-colors duration-[var(--dur-base)] md:min-h-28 md:p-2",
                      isWeekendColumn(columnIndex) && "bg-[hsl(var(--surface-1)/0.4)]",
                      entries.length > 0 && "bg-primary/[0.05]",
                      isToday && "bg-primary/[0.08]",
                    )}
                    role="cell"
                    aria-label={[
                      new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                      ...entries.map(
                        (entry) =>
                          `${getOccurrenceTitle(entry)} — ${t(EVENT_TYPE_META[entry.type].label)}`,
                      ),
                    ].join(", ")}
                  >
                    <time
                      dateTime={date}
                      className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-semibold md:h-7 md:min-w-7 md:rounded-lg md:px-1.5 md:text-sm",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {day}
                    </time>
                    <div className="mt-1 flex min-h-2 flex-wrap items-center gap-0.5 md:mt-1.5 md:block md:space-y-1">
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
                        const meta = EVENT_TYPE_META[entry.type];
                        const TypeIcon = meta.icon;
                        // Текст чипа — всегда foreground: тем же оттенком, что и заливка,
                        // он давал 2.22:1 в светлой теме и 1.83:1 в wine-sky.
                        const className = cn(
                          "flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          meta.chip,
                        );
                        const label = `${getOccurrenceTitle(entry)} — ${t(meta.label)}`;
                        const chipContent = (
                          <>
                            <TypeIcon className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="min-w-0 truncate">{getOccurrenceTitle(entry)}</span>
                          </>
                        );
                        return (
                          <span key={entry.id}>
                            <TypeIcon
                              className="inline-block h-3 w-3 shrink-0 text-muted-foreground md:hidden"
                              aria-hidden
                            />
                            {href ? (
                              <Link
                                href={href}
                                title={label}
                                className={cn(className, "max-md:hidden")}
                              >
                                {chipContent}
                              </Link>
                            ) : (
                              <span title={label} className={cn(className, "max-md:hidden")}>
                                {chipContent}
                              </span>
                            )}
                          </span>
                        );
                      })}
                      {entries.length > 3 ? (
                        <p className="px-0.5 text-[10px] font-semibold text-muted-foreground md:px-1 md:text-[11px]">
                          {t("Ещё")}: {entries.length - 3}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {groupedMonth.length > 0 ? (
        <div className="mt-3 border-t border-border/45 pt-3 md:hidden">
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
                const meta = EVENT_TYPE_META[entry.type];
                const TypeIcon = meta.icon;
                const content = (
                  <>
                    <time
                      dateTime={date}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-foreground"
                    >
                      {Number(date.slice(-2))}
                    </time>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {getOccurrenceTitle(entry)}
                    </span>
                    {/* Тип назван словом, а не только точкой: подпись уходит
                        в поток для скринридера, иконка — визуальное усиление. */}
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                      <span className="max-[26rem]:sr-only">{t(meta.label)}</span>
                    </span>
                  </>
                );
                const itemClassName =
                  "flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                return href ? (
                  <Link
                    key={`${date}:${entry.id}`}
                    href={href}
                    className={cn(itemClassName, "hover:bg-primary/5")}
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
  // Ошибка загрузки мьютов читается: без неё `?? false` показывал заглушённое
  // событие как активное, то есть интерфейс уверенно врал в обе стороны.
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
  const groupedUpcoming = useMemo(() => groupCalendarOccurrences(upcoming), [upcoming]);
  const monthOccurrences = filtered.filter((occurrence) =>
    occurrence.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`),
  );
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  // Раньше это был обычный useEffect: на мобильном успевала отрисоваться
  // месячная сетка, и только потом вид дёргался в список. Layout-эффект
  // выполняется до отрисовки кадра, поэтому подмена больше не видна.
  useIsomorphicLayoutEffect(() => {
    setView(getInitialCalendarView(window.matchMedia("(max-width: 767px)").matches));
  }, []);

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  /*
   * Ответ проверяется, отказ называется вслух.
   *
   * Раньше `fetch` уходил в пустоту: при сбое сети кнопка просто ничего
   * не делала, состояние не откатывалось и человек, специально пришедший
   * заглушить болезненную дату, оставался в уверенности, что заглушил.
   */
  async function toggleReminderMute(occurrence: CalendarOccurrence) {
    const key = occurrenceReminderKey(occurrence);
    const muted = muteData?.mutedEventKeys.includes(key) ?? false;
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
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || t("Не удалось изменить напоминания"));
      }
      toast.success(muted ? t("Напоминания включены") : t("Напоминания выключены"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось изменить напоминания"));
    } finally {
      await mutateMutes();
    }
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
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] max-xl:hidden [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label={t("Фильтры календаря")}
              >
                {FILTERS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={filter === option.value ? "segmentActive" : "ghost"}
                    size="sm"
                    className="shrink-0"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                  >
                    {t(option.label)}
                  </Button>
                ))}
              </div>
              <div className="grid gap-1 xl:hidden">
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
                    variant={view === "list" ? "segmentActive" : "ghost"}
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    <LayoutList className="h-4 w-4" aria-hidden />
                    {t("Список")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={view === "month" ? "segmentActive" : "ghost"}
                    aria-pressed={view === "month"}
                    onClick={() => setView("month")}
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    {t("Месяц")}
                  </Button>
                </div>
                {/*
                 * Год относится только к сетке. В списке он молча выбрасывал
                 * всё от сегодня до конца выбранного года: человек выбирал
                 * 2027 «заглянуть вперёд» и видел пустоту без объяснений.
                 */}
                {view === "month" ? (
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
                ) : null}
              </div>
            </div>
          </section>

          {/* Состояние напоминаний недоступно — говорим об этом, а не выдаём
              все события за незаглушённые. */}
          {muteError ? (
            <RetryNotice onRetry={() => void mutateMutes()}>
              {t("Не удалось загрузить состояние напоминаний.")}
            </RetryNotice>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center" role="status">
              <Loader2
                className="h-7 w-7 animate-spin motion-reduce:animate-none text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">{t("Загрузка календаря")}</span>
            </div>
          ) : error ? (
            <EmptyState
              icon={<CalendarDays className="h-7 w-7" aria-hidden />}
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
                {/* Смена месяца раньше проходила беззвучно: фокус оставался
                    на стрелке, а заголовок и содержимое сетки менялись без
                    единого объявления. */}
                <h2 className="section-title" aria-live="polite">
                  {capitalizeFirst(monthLabel, locale)}
                </h2>
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
              icon={<CalendarDays className="h-7 w-7" aria-hidden />}
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
                        muted={
                          muteData?.mutedEventKeys.includes(occurrenceReminderKey(entry)) ?? false
                        }
                        onToggleMuted={() => void toggleReminderMute(entry)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/*
           * Панель личных событий стоит после контента, а не над ним.
           * Раньше она занимала половину первого экрана на телефоне и была
           * увенчана самой яркой кнопкой страницы — при том что у большинства
           * участников она пуста, а пришли они смотреть чужие даты.
           */}
          <PersonalEventsPanel />

          {history.length > 0 ? (
            <section className={cn(uiSurface.contentPanel, "p-4 sm:p-5")}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={historyOpen}
                aria-controls="calendar-history-panel"
                onClick={() => setHistoryOpen((open) => !open)}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <History className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t("История")}
                </span>
                <span className="text-sm text-muted-foreground">{history.length}</span>
              </button>
              {historyOpen ? (
                <div
                  id="calendar-history-panel"
                  className="mt-3 divide-y divide-border/55 border-t border-border/55 pt-3"
                >
                  {history.map((entry) => (
                    <EventRow
                      key={entry.id}
                      occurrence={entry}
                      locale={locale}
                      t={t}
                      muted={
                        muteData?.mutedEventKeys.includes(occurrenceReminderKey(entry)) ?? false
                      }
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
