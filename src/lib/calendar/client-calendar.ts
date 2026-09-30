import type { CalendarOccurrence } from "./calendar-events";

/*
 * Событие календаря собирается в `calendar-events` — там же оно и
 * объявлено, один раз. Здесь тип только пере-экспортирован: экраны берут
 * весь календарный инструментарий из этого модуля, и тип, в котором выражен
 * его API, не должен быть исключением, ради которого приходится тянуться в
 * серверный. Раньше вместо этого союз был собран заново из тех же трёх
 * составляющих — копия, которую ничто не удерживало от расхождения.
 */
export type { CalendarOccurrence };
export { thematicWishlistHref } from "./calendar-events";

export type CalendarFilter = "ALL" | CalendarOccurrence["type"];

export function getClientLocalDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function getOccurrenceTitle(occurrence: CalendarOccurrence): string {
  if (occurrence.type === "BIRTHDAY") return occurrence.person.name;
  if (occurrence.type === "PERSONAL") return occurrence.title;
  return occurrence.name;
}

/** Группы по дню (`YYYY-MM-DD`) или по месяцу (`YYYY-MM`) в порядке входа. */
export function groupCalendarOccurrences(
  occurrences: CalendarOccurrence[],
  by: "date" | "month" = "date",
): Array<[string, CalendarOccurrence[]]> {
  // Не Map.groupBy: код клиентский, Safari до 17.4 его не знает.
  const groups = new Map<string, CalendarOccurrence[]>();
  for (const occurrence of occurrences) {
    const key = by === "month" ? occurrence.date.slice(0, 7) : occurrence.date;
    const entries = groups.get(key);
    if (entries) entries.push(occurrence);
    else groups.set(key, [occurrence]);
  }
  return [...groups.entries()];
}

export function filterCalendarOccurrences(
  occurrences: CalendarOccurrence[],
  filter: CalendarFilter,
): CalendarOccurrence[] {
  return filter === "ALL"
    ? occurrences
    : occurrences.filter((occurrence) => occurrence.type === filter);
}

export function getCalendarSections(
  occurrences: CalendarOccurrence[],
  today: string,
): { upcoming: CalendarOccurrence[]; history: CalendarOccurrence[] } {
  const upcoming: CalendarOccurrence[] = [];
  const history: CalendarOccurrence[] = [];

  for (const occurrence of occurrences) {
    if (
      occurrence.type === "PERSONAL" &&
      occurrence.recurrence === "ONCE" &&
      occurrence.date < today
    ) {
      history.push(occurrence);
    } else if (occurrence.date >= today) {
      upcoming.push(occurrence);
    }
  }

  return { upcoming, history };
}

export function getUpcomingOccurrences(
  occurrences: CalendarOccurrence[],
  today: string,
  limit = 3,
): CalendarOccurrence[] {
  return occurrences
    .filter((occurrence) => occurrence.date >= today)
    .toSorted(
      (left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}
