import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { personalEvents } from "@/lib/calendar/prisma-personal-events";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createPersonalEventItemHandlers } from "../events-handler";

const handlers = createPersonalEventItemHandlers({
  getActorId: getSessionUserIdVerified,
  updatePersonalEvent: personalEvents.update,
  deletePersonalEvent: personalEvents.delete,
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
