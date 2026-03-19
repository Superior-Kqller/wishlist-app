import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { ensureUserIdsExist } from "@/lib/list-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateListSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  viewerIds: z.array(z.string().trim()).optional(),
});

// GET /api/lists/[id] — одна подборка (если пользователь имеет доступ)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  const list = await prisma.list.findFirst({
    where: {
      id,
      OR: [{ userId: currentUserId }, { viewers: { some: { userId: currentUserId } } }],
    },
    include: {
      _count: { select: { items: true } },
      viewers: { select: { userId: true } },
    },
  });

  if (!list) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json({
    id: list.id,
    name: list.name,
    userId: list.userId,
    _count: list._count,
    viewerIds: list.viewers.map((v) => v.userId),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  });
}

// PATCH /api/lists/[id] — только владелец
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.list.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== currentUserId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = updateListSchema.parse(body);

    if (data.viewerIds !== undefined) {
      const normalizedViewerIds = Array.from(
        new Set(
          data.viewerIds
            .map((uid) => uid.trim())
            .filter((uid) => uid.length > 0 && uid !== currentUserId)
        )
      );
      const viewerCheck = await ensureUserIdsExist(normalizedViewerIds);
      if (!viewerCheck.ok) {
        return NextResponse.json(
          {
            error: "Указаны несуществующие пользователи",
            details: { unknownIds: viewerCheck.missing },
          },
          { status: 400 }
        );
      }
      await prisma.$transaction(async (tx) => {
        await tx.listViewer.deleteMany({ where: { listId: id } });
        if (normalizedViewerIds.length > 0) {
          await tx.listViewer.createMany({
            data: normalizedViewerIds.map((userId) => ({ listId: id, userId })),
          });
        }
      });
    }

    const updateData: { name?: string } = {};
    if (data.name !== undefined) updateData.name = data.name;

    const list = await prisma.list.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { items: true } },
        viewers: { select: { userId: true } },
      },
    });

    return NextResponse.json({
      id: list.id,
      name: list.name,
      userId: list.userId,
      _count: list._count,
      viewerIds: list.viewers.map((v) => v.userId),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Конфликт при обновлении доступа к подборке. Удалите дубликаты и повторите попытку.",
        },
        { status: 409 }
      );
    }
    sanitizeError("Update list error", err, { listId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id] — только владелец; у Item обнуляем listId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.list.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existing || existing.userId !== currentUserId) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    await prisma.item.updateMany({ where: { listId: id }, data: { listId: null } });
    await prisma.list.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    sanitizeError("Delete list error", err, { listId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
