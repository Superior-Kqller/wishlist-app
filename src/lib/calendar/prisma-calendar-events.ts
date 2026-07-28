import "server-only";
import { prisma } from "@/lib/prisma";
import { createCalendarEvents } from "./calendar-events";
import { createPrismaCalendarEventSource } from "./prisma-calendar-event-source";

export const calendarEvents = createCalendarEvents(
  createPrismaCalendarEventSource(prisma),
);
