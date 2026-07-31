import "server-only";
import { sanitizeError, sanitizeLog } from "@/lib/logger";
import { calendarReminders } from "./calendar-reminders";
import { startAutomaticReminderRunner } from "./automatic-reminder-runner";
import { prismaCalendarInstallationSettingsRepository } from "./prisma-installation-settings-repository";

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
