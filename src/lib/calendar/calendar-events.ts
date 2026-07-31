import { dateForHolidayRule } from "./holiday-rules";
import { formatLocalDate, isLeapYear, parseLocalDate } from "./local-date";
import { thematicWishlistHref } from "./wishlist-link";
import type { CalendarAudience, PersonalEventRecurrence } from "./personal-events";
import type {
  CalendarEventSource,
  CalendarPersonalEventSource,
  CalendarWishlistSource,
} from "./calendar-event-source";

export type CalendarEventSourceType = "BIRTHDAY" | "PERSONAL" | "HOLIDAY";
export type CalendarEventsErrorCode = "INVALID_DATE_RANGE" | "INVALID_EVENT_SOURCE";

export class CalendarEventsError extends Error {
  constructor(readonly code: CalendarEventsErrorCode) {
    super(code);
    this.name = "CalendarEventsError";
  }
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

export interface HolidayOccurrence {
  id: string;
  type: "HOLIDAY";
  date: string;
  name: string;
  congratulated: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    wishlists: Array<{ id: string; name: string }>;
  }>;
}

export type CalendarOccurrence = BirthdayOccurrence | PersonalEventOccurrence | HolidayOccurrence;

export interface ReminderEventFact {
  sourceType: CalendarEventSourceType;
  sourceId: string;
  occurrenceDate: string;
  title: string;
  audienceUserIds: string[];
  excludedRecipientIds: string[];
  congratulated: string[];
  wishlistLinksByRecipient: Record<string, Array<{ label: string; href: string }>>;
}

export interface CalendarRange {
  rangeStart: string;
  rangeEnd: string;
}

function yearsIn(range: CalendarRange): number[] {
  const start = parseLocalDate(range.rangeStart);
  const end = parseLocalDate(range.rangeEnd);
  if (!start || !end || range.rangeStart > range.rangeEnd) {
    throw new CalendarEventsError("INVALID_DATE_RANGE");
  }
  return Array.from({ length: end.year - start.year + 1 }, (_, index) => start.year + index);
}

function birthdayDate(year: number, month: number, day: number): string {
  return month === 2 && day === 29 && !isLeapYear(year)
    ? formatLocalDate(year, 3, 1)
    : formatLocalDate(year, month, day);
}

function datesForPersonalEvent(
  event: CalendarPersonalEventSource,
  range: CalendarRange,
  years: number[],
  validDatesOnly = true,
): string[] {
  if (event.recurrence === "ONCE") {
    return event.date >= range.rangeStart && event.date <= range.rangeEnd ? [event.date] : [];
  }
  const source = parseLocalDate(event.date);
  if (!source) return [];
  return years
    .map((year) => formatLocalDate(year, source.month, source.day))
    .filter(
      (date) =>
        (!validDatesOnly || parseLocalDate(date)) &&
        date >= range.rangeStart &&
        date <= range.rangeEnd,
    );
}

function audienceFor(
  ownerId: string,
  audience: CalendarAudience,
  viewerIds: string[],
  allUserIds: string[],
): string[] {
  if (audience === "ALL") return allUserIds;
  if (audience === "SELECTED") return [ownerId, ...viewerIds];
  return [ownerId];
}

function canSee(
  ownerId: string,
  audience: CalendarAudience,
  viewerIds: string[],
  actorId: string,
): boolean {
  return (
    ownerId === actorId ||
    audience === "ALL" ||
    (audience === "SELECTED" && viewerIds.includes(actorId))
  );
}

function accessibleWishlists(
  wishlists: CalendarWishlistSource[],
  personId: string,
  recipientId: string,
) {
  return wishlists
    .filter(
      (wishlist) =>
        wishlist.ownerId === personId &&
        (wishlist.ownerId === recipientId || wishlist.viewerIds.includes(recipientId)),
    )
    .map((wishlist) => ({
      label: `Вишлист «${wishlist.name}»`,
      href: thematicWishlistHref(personId, wishlist.id),
    }));
}

export function createCalendarEvents(source: CalendarEventSource) {
  return {
    async calendarFor(actorId: string, range: CalendarRange): Promise<CalendarOccurrence[]> {
      const years = yearsIn(range);
      const [people, personalEvents, holidays, wishlists] = await Promise.all([
        source.listPeople(),
        source.listPersonalEvents(),
        source.listEnabledHolidays(),
        source.listWishlistsAccessibleBy([actorId]),
      ]);

      const birthdays: BirthdayOccurrence[] = people.flatMap((person) => {
        if (
          person.birthdayDay === null ||
          person.birthdayMonth === null ||
          !canSee(person.id, person.birthdayAudience, person.birthdayViewerIds, actorId)
        ) {
          return [];
        }
        return years.flatMap((year) => {
          const date = birthdayDate(year, person.birthdayMonth!, person.birthdayDay!);
          if (date < range.rangeStart || date > range.rangeEnd) return [];
          return [
            {
              id: `birthday:${person.id}:${date}`,
              type: "BIRTHDAY" as const,
              date,
              person: {
                id: person.id,
                name: person.name,
                avatarUrl: person.avatarUrl,
              },
              isOwn: person.id === actorId,
            },
          ];
        });
      });

      const personal: PersonalEventOccurrence[] = personalEvents.flatMap((event) => {
        if (!canSee(event.ownerId, event.audience, event.viewerIds, actorId)) {
          return [];
        }
        return datesForPersonalEvent(event, range, years).map((date) => ({
          id: `personal:${event.id}:${date}`,
          sourceId: event.id,
          type: "PERSONAL" as const,
          title: event.title,
          description: event.description,
          date,
          recurrence: event.recurrence,
          isOwn: event.ownerId === actorId,
        }));
      });
      const nonHolidays = [...birthdays, ...personal].sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          (left.type === "PERSONAL" ? left.title : left.person.name).localeCompare(
            right.type === "PERSONAL" ? right.title : right.person.name,
            "ru",
          ),
      );

      const holidayOccurrences: HolidayOccurrence[] = holidays
        .flatMap((holiday) =>
          years.flatMap((year) => {
            const date = dateForHolidayRule(holiday.rule, year);
            if (date < range.rangeStart || date > range.rangeEnd) return [];
            return [
              {
                id: `holiday:${holiday.id}:${date}`,
                type: "HOLIDAY" as const,
                date,
                name: holiday.name,
                congratulated:
                  holiday.theme === null
                    ? []
                    : people
                        .filter(
                          (person) =>
                            person.thematicHolidayConsent && person.gender === holiday.theme,
                        )
                        .sort((left, right) => left.name.localeCompare(right.name, "ru"))
                        .map((person) => ({
                          id: person.id,
                          name: person.name,
                          avatarUrl: person.avatarUrl,
                          wishlists: wishlists
                            .filter(
                              (wishlist) =>
                                wishlist.ownerId === person.id &&
                                (wishlist.ownerId === actorId ||
                                  wishlist.viewerIds.includes(actorId)),
                            )
                            .map(({ id, name }) => ({ id, name })),
                        })),
              },
            ];
          }),
        )
        .sort(
          (left, right) =>
            left.date.localeCompare(right.date) || left.name.localeCompare(right.name, "ru"),
        );

      return [...nonHolidays, ...holidayOccurrences].sort((left, right) =>
        left.date.localeCompare(right.date),
      );
    },

    async reminderFacts(range: CalendarRange): Promise<ReminderEventFact[]> {
      const years = yearsIn(range);
      const [people, personalEvents, holidays] = await Promise.all([
        source.listPeople(),
        source.listPersonalEvents(),
        source.listEnabledHolidays(),
      ]);
      const allUserIds = people.map((person) => person.id);
      const wishlists = await source.listWishlistsAccessibleBy(allUserIds);
      const facts: ReminderEventFact[] = [];

      for (const person of people) {
        if (person.birthdayDay === null || person.birthdayMonth === null) continue;
        const audienceUserIds = audienceFor(
          person.id,
          person.birthdayAudience,
          person.birthdayViewerIds,
          allUserIds,
        );
        for (const year of years) {
          const occurrenceDate = birthdayDate(year, person.birthdayMonth, person.birthdayDay);
          if (occurrenceDate < range.rangeStart || occurrenceDate > range.rangeEnd) {
            continue;
          }
          facts.push({
            sourceType: "BIRTHDAY",
            sourceId: person.id,
            occurrenceDate,
            title: `День рождения: ${person.name}`,
            audienceUserIds,
            excludedRecipientIds: [person.id],
            congratulated: [person.name],
            wishlistLinksByRecipient: Object.fromEntries(
              audienceUserIds.map((recipientId) => [
                recipientId,
                accessibleWishlists(wishlists, person.id, recipientId),
              ]),
            ),
          });
        }
      }

      for (const event of personalEvents) {
        const audienceUserIds = audienceFor(
          event.ownerId,
          event.audience,
          event.viewerIds,
          allUserIds,
        );
        for (const occurrenceDate of datesForPersonalEvent(event, range, years, false)) {
          facts.push({
            sourceType: "PERSONAL",
            sourceId: event.id,
            occurrenceDate,
            title: event.title,
            audienceUserIds,
            excludedRecipientIds: [],
            congratulated: [],
            wishlistLinksByRecipient: {},
          });
        }
      }

      for (const holiday of holidays) {
        if (!holiday.remindersEnabled) continue;
        const congratulated = holiday.theme
          ? people.filter(
              (person) => person.thematicHolidayConsent && person.gender === holiday.theme,
            )
          : [];
        for (const year of years) {
          const occurrenceDate = dateForHolidayRule(holiday.rule, year);
          if (occurrenceDate < range.rangeStart || occurrenceDate > range.rangeEnd) {
            continue;
          }
          facts.push({
            sourceType: "HOLIDAY",
            sourceId: holiday.id,
            occurrenceDate,
            title: holiday.name,
            audienceUserIds: allUserIds,
            excludedRecipientIds: congratulated.map((person) => person.id),
            congratulated: congratulated.map((person) => person.name),
            wishlistLinksByRecipient: Object.fromEntries(
              allUserIds.map((recipientId) => [
                recipientId,
                congratulated.flatMap((person) =>
                  accessibleWishlists(wishlists, person.id, recipientId),
                ),
              ]),
            ),
          });
        }
      }
      return facts;
    },
  };
}

export type CalendarEvents = ReturnType<typeof createCalendarEvents>;
