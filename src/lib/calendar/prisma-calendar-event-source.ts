import type { PrismaClient } from "@prisma/client";
import type { CalendarEventSource } from "./calendar-event-source";
import { CalendarEventsError } from "./calendar-events";
import { holidayRuleSchema } from "./holiday-rules";

export function createPrismaCalendarEventSource(
  prisma: PrismaClient,
): CalendarEventSource {
  return {
    async listPeople() {
      const people = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          birthdayDay: true,
          birthdayMonth: true,
          birthdayAudience: true,
          birthdayViewers: { select: { viewerId: true } },
          gender: true,
          thematicHolidayConsent: true,
        },
      });
      return people.map((person) => ({
        id: person.id,
        name: person.name,
        avatarUrl: person.avatarUrl,
        birthdayDay: person.birthdayDay,
        birthdayMonth: person.birthdayMonth,
        birthdayAudience: person.birthdayAudience,
        birthdayViewerIds: person.birthdayViewers.map((viewer) => viewer.viewerId),
        gender: person.gender,
        thematicHolidayConsent: person.thematicHolidayConsent,
      }));
    },

    async listPersonalEvents() {
      const events = await prisma.personalEvent.findMany({
        select: {
          id: true,
          ownerId: true,
          title: true,
          description: true,
          localDate: true,
          recurrence: true,
          audience: true,
          viewers: { select: { viewerId: true } },
        },
      });
      return events.map((event) => ({
        id: event.id,
        ownerId: event.ownerId,
        title: event.title,
        description: event.description,
        date: event.localDate,
        recurrence: event.recurrence,
        audience: event.audience,
        viewerIds: event.viewers.map((viewer) => viewer.viewerId),
      }));
    },

    async listEnabledHolidays() {
      const holidays = await prisma.holiday.findMany({
        where: { enabled: true },
      });
      return holidays.map((holiday) => {
        const rule = holidayRuleSchema.safeParse(
          holiday.ruleKind === "FIXED"
            ? { kind: "FIXED", month: holiday.month, day: holiday.day }
            : {
                kind: "NTH_WEEKDAY",
                month: holiday.month,
                weekday: holiday.weekday,
                occurrence: holiday.occurrence,
              },
        );
        if (!rule.success) {
          throw new CalendarEventsError("INVALID_EVENT_SOURCE");
        }
        return {
          id: holiday.id,
          name: holiday.name,
          rule: rule.data,
          remindersEnabled: holiday.remindersEnabled,
          theme: holiday.theme,
        };
      });
    },

    async listWishlistsAccessibleBy(userIds) {
      const wishlists = await prisma.list.findMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { viewers: { some: { userId: { in: userIds } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          userId: true,
          viewers: {
            where: { userId: { in: userIds } },
            select: { userId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return wishlists.map((wishlist) => ({
        id: wishlist.id,
        name: wishlist.name,
        ownerId: wishlist.userId,
        viewerIds: wishlist.viewers.map((viewer) => viewer.userId),
      }));
    },
  };
}
