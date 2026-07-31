import "server-only";
import { prisma } from "@/lib/prisma";
import { createPrismaCalendarReminderRepository } from "./prisma-reminder-persistence";

export const prismaCalendarReminderRepository = createPrismaCalendarReminderRepository(prisma);
