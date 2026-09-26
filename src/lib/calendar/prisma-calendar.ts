import "server-only";
import { prisma } from "@/lib/prisma";
import { createCalendarEvents } from "./calendar-events";
import { createHolidayCatalog } from "./holiday-catalog";
import { createPersonalEvents } from "./personal-events";
import { createPrismaCalendarEventSource } from "./prisma-calendar-event-source";
import { createPrismaHolidayCatalogRepository } from "./prisma-holiday-catalog-repository";
import { createPrismaPersonalEventRepository } from "./prisma-personal-event-repository";
import { createPrismaCalendarReminderRepository } from "./prisma-reminder-persistence";

// Сборка календарных модулей на рабочем Prisma-клиенте. Адаптеры принимают клиент
// параметром, чтобы интеграционные тесты подставляли свой (PGlite).
export const calendarEvents = createCalendarEvents(createPrismaCalendarEventSource(prisma));
export const holidayCatalog = createHolidayCatalog(createPrismaHolidayCatalogRepository(prisma));
export const personalEvents = createPersonalEvents(createPrismaPersonalEventRepository(prisma));
export const prismaCalendarReminderRepository = createPrismaCalendarReminderRepository(prisma);
