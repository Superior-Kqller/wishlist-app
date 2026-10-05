import "server-only";
import { prisma } from "@/lib/prisma";
import { sanitizeError, sanitizeLog } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { startAutomaticReminderRunner } from "./automatic-reminder-runner";
import { createCalendarEvents } from "./calendar-events";
import { createHolidayCatalog } from "./holiday-catalog";
import { createPersonalEvents } from "./personal-events";
import { createPrismaCalendarEventSource } from "./prisma-calendar-event-source";
import { createPrismaHolidayCatalogRepository } from "./prisma-holiday-catalog-repository";
import { prismaCalendarInstallationSettingsRepository } from "./prisma-installation-settings-repository";
import { createPrismaPersonalEventRepository } from "./prisma-personal-event-repository";
import { createPrismaCalendarReminderRepository } from "./prisma-reminder-persistence";
import { createCalendarReminderModule } from "./reminder-module";

// Сборка календарных модулей на рабочем Prisma-клиенте. Адаптеры принимают клиент
// параметром, чтобы интеграционные тесты подставляли свой (PGlite).
export const calendarEvents = createCalendarEvents(createPrismaCalendarEventSource(prisma));
export const holidayCatalog = createHolidayCatalog(createPrismaHolidayCatalogRepository(prisma));
export const personalEvents = createPersonalEvents(createPrismaPersonalEventRepository(prisma));

const calendarReminders = createCalendarReminderModule(
  calendarEvents,
  createPrismaCalendarReminderRepository(prisma),
  { send: sendTelegramMessage },
  {
    deliveryError: (error, context) =>
      sanitizeError("Calendar reminder delivery error", error, context),
  },
);

let started = false;

export function startProductionCalendarReminderRunner() {
  if (started) return;
  started = true;
  startAutomaticReminderRunner({
    getTimeZone: async () => (await prismaCalendarInstallationSettingsRepository.get()).timeZone,
    processDueReminders: async (input) => {
      const result = await calendarReminders.processDueReminders(input);
      sanitizeLog("Calendar reminders processed", {
        localDate: input.localDate,
        sent: result.sent,
        failed: result.failed,
      });
      return result;
    },
    publicBaseUrl: process.env.NEXTAUTH_URL ?? `http://127.0.0.1:${process.env.PORT ?? "4030"}`,
    onError: (error) => sanitizeError("Calendar reminder runner error", error),
  });
}
