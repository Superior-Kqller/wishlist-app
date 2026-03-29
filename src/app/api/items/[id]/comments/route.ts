import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { canUserSeeItem } from "@/lib/list-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { z } from "zod";

const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

// GET /api/items/[id]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getSessionUserIdVerified();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id: itemId } = await params;

  const canSee = await canUserSeeItem(itemId, currentUserId);
  if (!canSee) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const comments = await prisma.itemComment.findMany({
    where: { itemId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

// POST /api/items/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getSessionUserIdVerified();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id: itemId } = await params;

  const canSee = await canUserSeeItem(itemId, currentUserId);
  if (!canSee) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = createCommentSchema.parse(body);

    const comment = await prisma.itemComment.create({
      data: {
        itemId,
        userId: currentUserId,
        text: data.text,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Create comment error", err, { itemId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
