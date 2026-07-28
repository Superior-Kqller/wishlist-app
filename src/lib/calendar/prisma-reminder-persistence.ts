import { Prisma, type PrismaClient } from "@prisma/client";
import type { CalendarReminderRepository } from "./reminder-module";

export function createPrismaCalendarReminderRepository(
  prisma: PrismaClient,
): CalendarReminderRepository {
  return {
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
}
