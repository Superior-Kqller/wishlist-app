import "server-only";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { createCalendarReminderModule } from "./reminder-module";
import { prismaCalendarReminderRepository } from "./prisma-reminder-repository";
import { sanitizeError } from "@/lib/logger";

export const calendarReminders = createCalendarReminderModule(
  prismaCalendarReminderRepository,
  {
    send: sendTelegramMessage,
  },
  {
    deliveryError: (error, context) =>
      sanitizeError("Calendar reminder delivery error", error, context),
  },
);
