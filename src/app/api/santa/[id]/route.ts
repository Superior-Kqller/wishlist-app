import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { unauthorizedResponse } from "@/lib/api-responses";
import { sanitizeError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createSanta } from "@/lib/santa";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  if (limited) return limited;
  const actorId = await getSessionUserIdVerified();
  if (!actorId) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    const deleted = await createSanta(prisma).remove(actorId, id);
    return deleted
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Жеребьёвка не найдена" }, { status: 404 });
  } catch (error) {
    sanitizeError("Delete santa draw error", error, { actorId, drawId: id });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
