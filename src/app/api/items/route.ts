import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTagColor } from "@/lib/utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeList, getVisibleListIdsForUser } from "@/lib/list-utils";
import { z } from "zod";

const createItemSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().optional().or(z.literal("")),
  price: z.number().min(0).optional(),
  currency: z.string().default("RUB"),
  priority: z.number().min(1).max(5).default(3),
  images: z.array(z.string().url()).default([]),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  listId: z.string().trim().nullable().optional(),
});

/** Returns userId only if session exists and user still exists in DB (avoids FK after DB reset). */
async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  return user ? id : null;
}

// GET /api/items — общий список: все элементы всех пользователей (для двоих в семье)
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  // Получаем userId один раз (устраняем дублирование)
  const currentUserId = await getUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Пагинация и фильтрация по пользователю и подборке
  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Макс 100
  const userIdParam = searchParams.get("userId");
  const listIdParam = searchParams.get("listId");

  const where: any = cursor ? { createdAt: { lt: new Date(cursor) } } : {};

  // Фильтрация по пользователю: "me" — только текущий, конкретный id — товары этого пользователя
  if (userIdParam === "me") {
    where.userId = currentUserId;
  } else if (userIdParam && userIdParam.trim() !== "") {
    where.userId = userIdParam.trim();
  }

  // Фильтрация по подборке: только если пользователь может видеть эту подборку
  if (listIdParam && listIdParam.trim() !== "") {
    const canSee = await canUserSeeList(listIdParam.trim(), currentUserId);
    if (!canSee) {
      return NextResponse.json({ items: [], pagination: { hasMore: false, nextCursor: null, limit } });
    }
    where.listId = listIdParam.trim();
  } else {
    // Показывать товары без подборки или в подборках, доступных пользователю
    const visibleListIds = await getVisibleListIdsForUser(currentUserId);
    where.OR = [
      { listId: null },
      { listId: { in: visibleListIds } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    include: { tags: true, user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1, // Берем на 1 больше для проверки наличия следующей страницы
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].createdAt.toISOString() : null;

  // Кэширование на 30 секунд для списка items (данные могут часто меняться)
  return NextResponse.json(
    {
      items: data,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

// POST /api/items
export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createItemSchema.parse(body);

    // Handle tags: upsert to avoid race conditions
    const tagConnections = await Promise.all(
      data.tags.map(async (tagName) => {
        const normalizedName = tagName.trim().toLowerCase();
        const tag = await prisma.tag.upsert({
          where: { name: normalizedName },
          update: {},
          create: { name: normalizedName, color: getTagColor(normalizedName) },
        });
        return { id: tag.id };
      })
    );

    const listId: string | null = data.listId ?? null;
    if (listId) {
      const list = await prisma.list.findUnique({ where: { id: listId }, select: { userId: true } });
      if (!list || list.userId !== userId) {
        return NextResponse.json({ error: "Подборка не найдена или доступ запрещён" }, { status: 400 });
      }
    }

    const item = await prisma.item.create({
      data: {
        title: data.title,
        url: data.url || null,
        price: data.price || null,
        currency: data.currency,
        priority: data.priority,
        images: data.images,
        notes: data.notes || null,
        userId,
        listId,
        tags: { connect: tagConnections },
      },
      include: { tags: true, user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Create item error", err, { userId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
