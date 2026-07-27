import "server-only";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CALENDAR_TIME_ZONE,
  type CalendarInstallationSettingsRepository,
} from "./installation-settings";

export const prismaCalendarInstallationSettingsRepository: CalendarInstallationSettingsRepository =
  {
    async get() {
      return prisma.calendarInstallationSettings.upsert({
        where: { id: 1 },
        create: { id: 1, timeZone: DEFAULT_CALENDAR_TIME_ZONE },
        update: {},
        select: { timeZone: true },
      });
    },
    async save(timeZone) {
      return prisma.calendarInstallationSettings.upsert({
        where: { id: 1 },
        create: { id: 1, timeZone },
        update: { timeZone },
        select: { timeZone: true },
      });
    },
  };
