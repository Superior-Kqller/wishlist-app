import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { ensureUserIdsExist } from "@/lib/list-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { z } from "zod";

const createListSchema = z.object({
  name: z.string().trim().min(1).max(200),
  viewerIds: z.array(z.string().trim()).default([]),
});

// GET /api/lists — подборки, которые текущий пользователь может видеть (владелец или в ListViewer)
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const lists = await prisma.list.findMany({
      where: {
        OR: [{ userId: currentUserId }, { viewers: { some: { userId: currentUserId } } }],
      },
      include: {
        _count: { select: { items: true } },
        viewers: { select: { userId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = lists.map((list) => ({
      id: list.id,
      name: list.name,
      userId: list.userId,
      _count: list._count,
      viewerIds: list.viewers.map((v) => v.userId),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (err) {
    sanitizeError("Get lists error", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/lists — создание подборки (name, viewerIds)
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createListSchema.parse(body);

    const viewerCandidates = data.viewerIds.filter((uid) => uid !== currentUserId);
    const viewerCheck = await ensureUserIdsExist(viewerCandidates);
    if (!viewerCheck.ok) {
      return NextResponse.json(
        {
          error: "Указаны несуществующие пользователи",
          details: { unknownIds: viewerCheck.missing },
        },
        { status: 400 }
      );
    }

    const list = await prisma.list.create({
      data: {
        name: data.name,
        userId: currentUserId,
        viewers: {
          create: data.viewerIds.filter((id) => id !== currentUserId).map((userId) => ({ userId })),
        },
      },
      include: {
        _count: { select: { items: true } },
        viewers: { select: { userId: true } },
      },
    });

    const result = {
      id: list.id,
      name: list.name,
      userId: list.userId,
      _count: list._count,
      viewerIds: list.viewers.map((v) => v.userId),
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Create list error", err, { userId: currentUserId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
