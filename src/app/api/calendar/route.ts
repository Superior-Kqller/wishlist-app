import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { createCalendarModule } from "@/lib/calendar/calendar-module";
import { prismaCalendarRepository } from "@/lib/calendar/prisma-calendar-repository";
import { listHolidayOccurrences } from "@/lib/calendar/holiday-calendar";
import { prismaHolidayCalendarRepository } from "@/lib/calendar/prisma-holiday-repository";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createCalendarGetHandler } from "./calendar-handler";

const calendarGet = createCalendarGetHandler({
  getActorId: getSessionUserIdVerified,
  listOccurrences: async (query) => {
    const [calendarOccurrences, holidays] = await Promise.all([
      createCalendarModule(prismaCalendarRepository).listOccurrences(query),
      listHolidayOccurrences(prismaHolidayCalendarRepository, query),
    ]);
    return [...calendarOccurrences, ...holidays].sort(
      (left, right) => left.date.localeCompare(right.date),
    );
  },
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;
  return calendarGet(request);
}
