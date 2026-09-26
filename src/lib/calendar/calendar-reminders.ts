import "server-only";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { createCalendarReminderModule } from "./reminder-module";
import { sanitizeError } from "@/lib/logger";
import { calendarEvents, prismaCalendarReminderRepository } from "./prisma-calendar";

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
