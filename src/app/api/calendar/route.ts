import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { listBirthdayOccurrences } from "@/lib/calendar/birthday-calendar";
import { prismaBirthdayCalendarRepository } from "@/lib/calendar/prisma-birthday-repository";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { listHolidayOccurrences } from "@/lib/calendar/holiday-calendar";
import { prismaHolidayCalendarRepository } from "@/lib/calendar/prisma-holiday-repository";
import { createCalendarGetHandler } from "./calendar-handler";

const calendarGet = createCalendarGetHandler({
  getActorId: getSessionUserIdVerified,
  listOccurrences: async (query) => {
    const [birthdays, holidays] = await Promise.all([
      listBirthdayOccurrences(prismaBirthdayCalendarRepository, query),
      listHolidayOccurrences(prismaHolidayCalendarRepository, query),
    ]);
    return [...birthdays, ...holidays].sort(
      (left, right) => left.date.localeCompare(right.date),
    );
  },
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;
  return calendarGet(request);
}
