import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateForRule, holidayRuleSchema } from "./holiday-calendar";
import { formatLocalDate, isLeapYear, parseLocalDate } from "./local-date";
import { thematicWishlistHref } from "./wishlist-link";
import type {
  CalendarReminderEvent,
  CalendarReminderRepository,
} from "./reminder-module";

function yearsInRange(start: string, end: string): number[] {
  const first = parseLocalDate(start);
  const last = parseLocalDate(end);
  if (!first || !last) throw new Error("INVALID_LOCAL_DATE");
  return Array.from({ length: last.year - first.year + 1 }, (_, index) => first.year + index);
}

function birthdayDate(year: number, month: number, day: number): string {
  return month === 2 && day === 29 && !isLeapYear(year)
    ? formatLocalDate(year, 3, 1)
    : formatLocalDate(year, month, day);
}

function visibleWishlistLinks(
  lists: Array<{ id: string; name: string; userId: string; viewers: Array<{ userId: string }> }>,
  personId: string,
  recipientIds: string[],
) {
  return Object.fromEntries(
    recipientIds.map((recipientId) => [
      recipientId,
      lists
        .filter(
          (list) =>
            list.userId === recipientId ||
            list.viewers.some((viewer) => viewer.userId === recipientId),
        )
        .map((list) => ({
          label: `Вишлист «${list.name}»`,
          href: thematicWishlistHref(personId, list.id),
        })),
    ]),
  );
}

export const prismaCalendarReminderRepository: CalendarReminderRepository = {
  async listReminderEvents(rangeStart, rangeEnd) {
    const years = yearsInRange(rangeStart, rangeEnd);
    const [users, personalEvents, holidays] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          birthdayDay: true,
          birthdayMonth: true,
          birthdayAudience: true,
          birthdayViewers: { select: { viewerId: true } },
          gender: true,
          thematicHolidayConsent: true,
          lists: {
            select: {
              id: true,
              name: true,
              userId: true,
              viewers: { select: { userId: true } },
            },
          },
        },
      }),
      prisma.personalEvent.findMany({
        select: {
          id: true,
          ownerId: true,
          title: true,
          localDate: true,
          recurrence: true,
          audience: true,
          viewers: { select: { viewerId: true } },
        },
      }),
      prisma.holiday.findMany({ where: { enabled: true } }),
    ]);
    const allUserIds = users.map((user) => user.id);
    const results: CalendarReminderEvent[] = [];

    for (const user of users) {
      if (user.birthdayDay === null || user.birthdayMonth === null) continue;
      const audienceUserIds =
        user.birthdayAudience === "ALL"
          ? allUserIds
          : user.birthdayAudience === "SELECTED"
            ? [user.id, ...user.birthdayViewers.map((viewer) => viewer.viewerId)]
            : [user.id];
      for (const year of years) {
        const occurrenceDate = birthdayDate(year, user.birthdayMonth, user.birthdayDay);
        if (occurrenceDate < rangeStart || occurrenceDate > rangeEnd) continue;
        results.push({
          sourceType: "BIRTHDAY",
          sourceId: user.id,
          occurrenceDate,
          title: `День рождения: ${user.name}`,
          audienceUserIds,
          excludedRecipientIds: [user.id],
          congratulated: [user.name],
          wishlistLinksByRecipient: visibleWishlistLinks(
            user.lists,
            user.id,
            audienceUserIds,
          ),
          remindersEnabled: true,
        });
      }
    }

    for (const event of personalEvents) {
      const audienceUserIds =
        event.audience === "ALL"
          ? allUserIds
          : event.audience === "SELECTED"
            ? [event.ownerId, ...event.viewers.map((viewer) => viewer.viewerId)]
            : [event.ownerId];
      const source = parseLocalDate(event.localDate);
      if (!source) continue;
      const dates =
        event.recurrence === "ONCE"
          ? [event.localDate]
          : years.map((year) => formatLocalDate(year, source.month, source.day));
      for (const occurrenceDate of dates) {
        if (occurrenceDate < rangeStart || occurrenceDate > rangeEnd) continue;
        results.push({
          sourceType: "PERSONAL",
          sourceId: event.id,
          occurrenceDate,
          title: event.title,
          audienceUserIds,
          excludedRecipientIds: [],
          congratulated: [],
          wishlistLinksByRecipient: {},
          remindersEnabled: true,
        });
      }
    }

    for (const holiday of holidays) {
      if (!holiday.remindersEnabled) continue;
      const rule = holidayRuleSchema.parse(
        holiday.ruleKind === "FIXED"
          ? { kind: "FIXED", month: holiday.month, day: holiday.day }
          : {
              kind: "NTH_WEEKDAY",
              month: holiday.month,
              weekday: holiday.weekday,
              occurrence: holiday.occurrence,
            },
      );
      const congratulatedUsers =
        holiday.theme === null
          ? []
          : users.filter(
              (user) =>
                user.thematicHolidayConsent && user.gender === holiday.theme,
            );
      for (const year of years) {
        const occurrenceDate = dateForRule(rule, year);
        if (occurrenceDate < rangeStart || occurrenceDate > rangeEnd) continue;
        results.push({
          sourceType: "HOLIDAY",
          sourceId: holiday.id,
          occurrenceDate,
          title: holiday.name,
          audienceUserIds: allUserIds,
          excludedRecipientIds: congratulatedUsers.map((user) => user.id),
          congratulated: congratulatedUsers.map((user) => user.name),
          wishlistLinksByRecipient: Object.fromEntries(
            allUserIds.map((recipientId) => [
              recipientId,
              congratulatedUsers.flatMap((person) =>
                visibleWishlistLinks(
                  person.lists,
                  person.id,
                  [recipientId],
                )[recipientId] ?? [],
              ),
            ]),
          ),
          remindersEnabled: true,
        });
      }
    }
    return results;
  },

  async listEligibleRecipients(userIds) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(userIds)] } },
      select: {
        id: true,
        telegramId: true,
        telegramConfirmedAt: true,
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        calendarEventMutes: { select: { sourceType: true, sourceId: true } },
      },
    });
    return users.map((user) => ({
      id: user.id,
      telegramId: user.telegramConfirmedAt ? user.telegramId : null,
      telegramNotificationsEnabled: user.telegramNotificationsEnabled,
      calendarNotificationsEnabled: user.calendarNotificationsEnabled,
      mutedEventKeys: user.calendarEventMutes.map(
        (mute) => `${mute.sourceType}:${mute.sourceId}`,
      ),
    }));
  },

  async claimDelivery(delivery) {
    try {
      await prisma.calendarReminderDelivery.create({ data: delivery });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return false;
      }
      throw error;
    }
  },

  async releaseDelivery(delivery) {
    await prisma.calendarReminderDelivery.deleteMany({ where: delivery });
  },
};
