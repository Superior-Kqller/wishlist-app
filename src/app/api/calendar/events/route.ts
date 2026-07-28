import { NextRequest } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { personalEvents } from "@/lib/calendar/prisma-personal-events";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createPersonalEventsHandlers } from "./events-handler";

const handlers = createPersonalEventsHandlers({
  getActorId: getSessionUserIdVerified,
  listOwnPersonalEvents: personalEvents.listOwn,
  createPersonalEvent: personalEvents.create,
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.read);
  return limited ?? handlers.GET();
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  return limited ?? handlers.POST(request);
}
