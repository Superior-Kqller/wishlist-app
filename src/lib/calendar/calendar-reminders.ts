import "server-only";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { createCalendarReminderModule } from "./reminder-module";
import { prismaCalendarReminderRepository } from "./prisma-reminder-repository";
import { sanitizeError } from "@/lib/logger";
import { calendarEvents } from "./prisma-calendar-events";

export const calendarReminders = createCalendarReminderModule(
  calendarEvents,
  prismaCalendarReminderRepository,
  {
    send: sendTelegramMessage,
  },
  {
    deliveryError: (error, context) =>
      sanitizeError("Calendar reminder delivery error", error, context),
  },
);
