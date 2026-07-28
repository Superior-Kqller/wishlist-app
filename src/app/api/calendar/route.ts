import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { calendarEvents } from "@/lib/calendar/prisma-calendar-events";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createCalendarGetHandler } from "./calendar-handler";

const calendarGet = createCalendarGetHandler({
  getActorId: getSessionUserIdVerified,
  calendarFor: calendarEvents.calendarFor,
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;
  return calendarGet(request);
}
