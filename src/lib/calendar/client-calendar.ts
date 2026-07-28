import type {
  BirthdayOccurrence,
  HolidayOccurrence,
  PersonalEventOccurrence,
} from "./calendar-events";

export type CalendarOccurrence =
  | BirthdayOccurrence
  | PersonalEventOccurrence
  | HolidayOccurrence;

export type CalendarFilter = "ALL" | CalendarOccurrence["type"];
export type CalendarView = "list" | "month";

export function getClientLocalDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function getOccurrenceTitle(occurrence: CalendarOccurrence): string {
  if (occurrence.type === "BIRTHDAY") return occurrence.person.name;
  if (occurrence.type === "PERSONAL") return occurrence.title;
  return occurrence.name;
}

export function groupCalendarOccurrences(
  occurrences: CalendarOccurrence[],
): Array<[string, CalendarOccurrence[]]> {
  const groups = new Map<string, CalendarOccurrence[]>();
  for (const occurrence of occurrences) {
    const entries = groups.get(occurrence.date);
    if (entries) entries.push(occurrence);
    else groups.set(occurrence.date, [occurrence]);
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
      (left, right) =>
        left.date.localeCompare(right.date) || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}

export function getInitialCalendarView(isMobile: boolean): CalendarView {
  return isMobile ? "list" : "month";
}
