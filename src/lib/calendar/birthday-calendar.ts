import {
  formatLocalDate,
  isLeapYear,
  parseLocalDate,
} from "./local-date";

export type BirthdayAudience = "ALL" | "SELECTED" | "PRIVATE";

export interface BirthdayCalendarSource {
  userId: string;
  name: string;
  avatarUrl: string | null;
  day: number;
  month: number;
  year: number | null;
  audience: BirthdayAudience;
  selectedViewerIds: string[];
}

export interface BirthdayCalendarRepository {
  listBirthdays(): Promise<BirthdayCalendarSource[]>;
}

export interface BirthdayOccurrence {
  id: string;
  type: "BIRTHDAY";
  date: string;
  person: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  isOwn: boolean;
}

export interface BirthdayCalendarQuery {
  actorId: string;
  rangeStart: string;
  rangeEnd: string;
}

function occurrenceDate(source: BirthdayCalendarSource, year: number): string {
  if (source.month === 2 && source.day === 29 && !isLeapYear(year)) {
    return formatLocalDate(year, 3, 1);
  }
  return formatLocalDate(year, source.month, source.day);
}

function isVisibleTo(source: BirthdayCalendarSource, actorId: string): boolean {
  return (
    source.userId === actorId ||
    source.audience === "ALL" ||
    (source.audience === "SELECTED" && source.selectedViewerIds.includes(actorId))
  );
}

export async function listBirthdayOccurrences(
  repository: BirthdayCalendarRepository,
  query: BirthdayCalendarQuery,
): Promise<BirthdayOccurrence[]> {
  const start = parseLocalDate(query.rangeStart);
  const end = parseLocalDate(query.rangeEnd);
  if (!start || !end) {
    throw new Error("INVALID_LOCAL_DATE");
  }
  if (query.rangeStart > query.rangeEnd) {
    throw new Error("INVALID_DATE_RANGE");
  }

  const sources = await repository.listBirthdays();
  const occurrences: BirthdayOccurrence[] = [];

  for (const source of sources) {
    if (!isVisibleTo(source, query.actorId)) continue;

    for (let year = start.year; year <= end.year; year += 1) {
      const date = occurrenceDate(source, year);
      if (date < query.rangeStart || date > query.rangeEnd) continue;

      occurrences.push({
        id: `birthday:${source.userId}:${date}`,
        type: "BIRTHDAY",
        date,
        person: {
          id: source.userId,
          name: source.name,
          avatarUrl: source.avatarUrl,
        },
        isOwn: source.userId === query.actorId,
      });
    }
  }

  return occurrences.sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.person.name.localeCompare(right.person.name, "ru"),
  );
}
