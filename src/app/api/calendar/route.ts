import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { listBirthdayOccurrences } from "@/lib/calendar/birthday-calendar";
import { prismaBirthdayCalendarRepository } from "@/lib/calendar/prisma-birthday-repository";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createCalendarGetHandler } from "./calendar-handler";

const calendarGet = createCalendarGetHandler({
  getActorId: getSessionUserIdVerified,
  listOccurrences: (query) =>
    listBirthdayOccurrences(prismaBirthdayCalendarRepository, query),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;
  return calendarGet(request);
}
