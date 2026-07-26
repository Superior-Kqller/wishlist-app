import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { createCalendarModule } from "@/lib/calendar/calendar-module";
import { prismaCalendarRepository } from "@/lib/calendar/prisma-calendar-repository";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createPersonalEventItemHandlers } from "../events-handler";

const calendar = createCalendarModule(prismaCalendarRepository);
const handlers = createPersonalEventItemHandlers({
  getActorId: getSessionUserIdVerified,
  updatePersonalEvent: calendar.updatePersonalEvent,
  deletePersonalEvent: calendar.deletePersonalEvent,
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  return limited ?? handlers.PATCH(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  return limited ?? handlers.DELETE(request, context);
}
