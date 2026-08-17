import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { reminderEventKey } from "@/lib/calendar/reminder-event-key";

const muteSchema = z.object({
  sourceType: z.enum(["BIRTHDAY", "PERSONAL", "HOLIDAY"]),
  sourceId: z.string().min(1).max(200),
  muted: z.boolean(),
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.read);
  if (limited) return limited;
  const userId = await getSessionUserIdVerified();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mutes = await prisma.calendarEventMute.findMany({
    where: { userId },
    select: { sourceType: true, sourceId: true },
  });
  return NextResponse.json({
    mutedEventKeys: mutes.map(reminderEventKey),
  });
}

export async function PUT(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  if (limited) return limited;
  const userId = await getSessionUserIdVerified();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = muteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка проверки данных", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const key = {
    userId_sourceType_sourceId: {
      userId,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
    },
  };
  if (parsed.data.muted) {
    await prisma.calendarEventMute.upsert({
      where: key,
      create: { userId, sourceType: parsed.data.sourceType, sourceId: parsed.data.sourceId },
      update: {},
    });
  } else {
    await prisma.calendarEventMute.deleteMany({
      where: { userId, sourceType: parsed.data.sourceType, sourceId: parsed.data.sourceId },
    });
  }
  return NextResponse.json({ muted: parsed.data.muted });
}
