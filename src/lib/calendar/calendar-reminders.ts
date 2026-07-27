import "server-only";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { createCalendarReminderModule } from "./reminder-module";
import { prismaCalendarReminderRepository } from "./prisma-reminder-repository";

export const calendarReminders = createCalendarReminderModule(
  prismaCalendarReminderRepository,
  {
    send: sendTelegramMessage,
  },
);
