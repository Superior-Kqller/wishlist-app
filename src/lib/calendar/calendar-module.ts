import type {
  BirthdayCalendarSource,
  BirthdayOccurrence,
} from "./birthday-calendar";
import { listBirthdayOccurrences } from "./birthday-calendar";
import { formatLocalDate, parseLocalDate } from "./local-date";

export type CalendarAudience = "ALL" | "SELECTED" | "PRIVATE";
export type PersonalEventRecurrence = "ONCE" | "YEARLY";

export interface PersonalEventRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  date: string;
  recurrence: PersonalEventRecurrence;
  audience: CalendarAudience;
  selectedViewerIds: string[];
}

export type PersonalEventInput = Omit<PersonalEventRecord, "id" | "ownerId">;

export interface PersonalEventOccurrence {
  id: string;
  sourceId: string;
  type: "PERSONAL";
  title: string;
  description: string | null;
  date: string;
  recurrence: PersonalEventRecurrence;
  isOwn: boolean;
}

export type CalendarOccurrence = BirthdayOccurrence | PersonalEventOccurrence;

export interface CalendarQuery {
  actorId: string;
  rangeStart: string;
  rangeEnd: string;
}

export interface CalendarRepository {
  findExistingUserIds(userIds: string[]): Promise<string[]>;
  listBirthdays(): Promise<BirthdayCalendarSource[]>;
  listPersonalEvents(): Promise<PersonalEventRecord[]>;
  createPersonalEvent(
    event: Omit<PersonalEventRecord, "id">,
  ): Promise<PersonalEventRecord>;
  updatePersonalEvent(
    id: string,
    ownerId: string,
    event: PersonalEventInput,
  ): Promise<PersonalEventRecord | null>;
  deletePersonalEvent(id: string, ownerId: string): Promise<boolean>;
}

async function assertValidAudience(
  repository: CalendarRepository,
  input: PersonalEventInput,
): Promise<void> {
  if (input.selectedViewerIds.length === 0) return;
  const existingIds = await repository.findExistingUserIds(input.selectedViewerIds);
  if (existingIds.length !== input.selectedViewerIds.length) {
    throw new Error("INVALID_EVENT_VIEWERS");
  }
}

function validateInput(input: PersonalEventInput): void {
  if (!input.title.trim() || input.title.length > 200) throw new Error("INVALID_TITLE");
  if (input.description !== null && input.description.length > 2000) {
    throw new Error("INVALID_DESCRIPTION");
  }
  if (!parseLocalDate(input.date)) throw new Error("INVALID_LOCAL_DATE");
  if (
    input.audience !== "SELECTED" &&
    input.selectedViewerIds.length > 0
  ) {
    throw new Error("INVALID_AUDIENCE");
  }
}

function normalizeInput(input: PersonalEventInput, actorId: string): PersonalEventInput {
  validateInput(input);
  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    selectedViewerIds: [...new Set(input.selectedViewerIds)].filter(
      (viewerId) => viewerId !== actorId,
    ),
  };
}

function isVisibleTo(event: PersonalEventRecord, actorId: string): boolean {
  return (
    event.ownerId === actorId ||
    event.audience === "ALL" ||
    (event.audience === "SELECTED" &&
      event.selectedViewerIds.includes(actorId))
  );
}

function eventDates(
  event: PersonalEventRecord,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (event.recurrence === "ONCE") {
    return event.date >= rangeStart && event.date <= rangeEnd ? [event.date] : [];
  }

  const source = parseLocalDate(event.date);
  const start = parseLocalDate(rangeStart);
  const end = parseLocalDate(rangeEnd);
  if (!source || !start || !end) return [];

  const dates: string[] = [];
  for (let year = start.year; year <= end.year; year += 1) {
    const date = formatLocalDate(year, source.month, source.day);
    if (parseLocalDate(date) && date >= rangeStart && date <= rangeEnd) dates.push(date);
  }
  return dates;
}

export function createCalendarModule(repository: CalendarRepository) {
  return {
    async createPersonalEvent(
      actorId: string,
      input: PersonalEventInput,
    ): Promise<PersonalEventRecord> {
      const normalized = normalizeInput(input, actorId);
      await assertValidAudience(repository, normalized);
      return repository.createPersonalEvent({
        ...normalized,
        ownerId: actorId,
      });
    },

    async updatePersonalEvent(
      actorId: string,
      id: string,
      input: PersonalEventInput,
    ): Promise<PersonalEventRecord | null> {
      const normalized = normalizeInput(input, actorId);
      await assertValidAudience(repository, normalized);
      return repository.updatePersonalEvent(id, actorId, normalized);
    },

    deletePersonalEvent(actorId: string, id: string): Promise<boolean> {
      return repository.deletePersonalEvent(id, actorId);
    },

    async listOwnPersonalEvents(actorId: string): Promise<PersonalEventRecord[]> {
      const events = await repository.listPersonalEvents();
      return events
        .filter((event) => event.ownerId === actorId)
        .sort((left, right) => left.date.localeCompare(right.date));
    },

    async listOccurrences(query: CalendarQuery): Promise<CalendarOccurrence[]> {
      if (
        !parseLocalDate(query.rangeStart) ||
        !parseLocalDate(query.rangeEnd) ||
        query.rangeStart > query.rangeEnd
      ) {
        throw new Error("INVALID_DATE_RANGE");
      }

      const [birthdays, personalEvents] = await Promise.all([
        listBirthdayOccurrences(
          { listBirthdays: () => repository.listBirthdays() },
          query,
        ),
        repository.listPersonalEvents(),
      ]);
      const personalOccurrences = personalEvents.flatMap((event) => {
        if (!isVisibleTo(event, query.actorId)) return [];
        return eventDates(event, query.rangeStart, query.rangeEnd).map((date) => ({
          id: `personal:${event.id}:${date}`,
          sourceId: event.id,
          type: "PERSONAL" as const,
          title: event.title,
          description: event.description,
          date,
          recurrence: event.recurrence,
          isOwn: event.ownerId === query.actorId,
        }));
      });

      return [...birthdays, ...personalOccurrences].sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          ("title" in left ? left.title : left.person.name).localeCompare(
            "title" in right ? right.title : right.person.name,
            "ru",
          ),
      );
    },
  };
}

export type CalendarModule = ReturnType<typeof createCalendarModule>;
