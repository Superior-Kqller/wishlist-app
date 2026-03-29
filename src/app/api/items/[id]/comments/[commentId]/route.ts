import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { canUserSeeItem } from "@/lib/list-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";

// DELETE /api/items/[id]/comments/[commentId] — только автор комментария
export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; commentId: string }> }
) {
  const rateLimitResponse = await rateLimit(_req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getSessionUserIdVerified();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id: itemId, commentId } = await params;

  const canSee = await canUserSeeItem(itemId, currentUserId);
  if (!canSee) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const comment = await prisma.itemComment.findFirst({
      where: { id: commentId, itemId },
      select: { id: true, userId: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 });
    }
    if (comment.userId !== currentUserId) {
      return NextResponse.json({ error: "Нельзя удалить чужой комментарий" }, { status: 403 });
    }

    await prisma.itemComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    sanitizeError("Delete comment error", err, { itemId, commentId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
