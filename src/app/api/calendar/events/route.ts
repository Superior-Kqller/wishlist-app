import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { createCalendarModule } from "@/lib/calendar/calendar-module";
import { prismaCalendarRepository } from "@/lib/calendar/prisma-calendar-repository";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createPersonalEventsHandlers } from "./events-handler";

const calendar = createCalendarModule(prismaCalendarRepository);
const handlers = createPersonalEventsHandlers({
  getActorId: getSessionUserIdVerified,
  listOwnPersonalEvents: calendar.listOwnPersonalEvents,
  createPersonalEvent: calendar.createPersonalEvent,
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.read);
  return limited ?? handlers.GET();
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  return limited ?? handlers.POST(request);
}
