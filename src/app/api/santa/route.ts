import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { unauthorizedResponse } from "@/lib/api-responses";
import { sanitizeError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createSanta } from "@/lib/santa";
import { notifySantaDraw } from "@/lib/telegram/notifications";

const santa = createSanta(prisma);

const drawSchema = z.object({
  title: z.string().trim().min(1).max(200),
  eventDate: z.iso.date(),
  budget: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .default(null)
    .transform((value) => value || null),
  participantIds: z.array(z.string().min(1)).max(200),
  /** Организатор участвует сам. */
  includeMe: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.read);
  if (limited) return limited;
  const actorId = await getSessionUserIdVerified();
  if (!actorId) return unauthorizedResponse();
  try {
    return NextResponse.json({ draws: await santa.listFor(actorId) });
  } catch (error) {
    sanitizeError("List santa draws error", error, { actorId });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitPresets.default);
  if (limited) return limited;
  const actorId = await getSessionUserIdVerified();
  if (!actorId) return unauthorizedResponse();
  try {
    const { includeMe, participantIds, ...input } = drawSchema.parse(await request.json());
    const draw = await santa.create(actorId, {
      ...input,
      participantIds: includeMe ? [...participantIds, actorId] : participantIds,
    });
    await notifySantaDraw(draw);
    // Пары в ответ не уходят: организатор не должен их видеть даже в сети.
    return NextResponse.json({ id: draw.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "SANTA_TOO_FEW") {
      return NextResponse.json({ error: "Нужно не меньше трёх участников" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SANTA_UNKNOWN_PARTICIPANT") {
      return NextResponse.json({ error: "Некорректный список участников" }, { status: 400 });
    }
    sanitizeError("Create santa draw error", error, { actorId });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
