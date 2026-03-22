import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTagColor } from "@/lib/utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeList, getVisibleListIdsForUser } from "@/lib/list-utils";
import { canSeeClaimerIdentity } from "@/lib/access-policy";
import { itemResponseWithoutList } from "@/lib/item-json";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const createItemSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().optional().or(z.literal("")),
  price: z.number().min(0).optional(),
  currency: z.string().default("RUB"),
  priority: z.number().min(1).max(5).default(3),
  images: z.array(z.string().url()).max(1).default([]),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  listId: z.string().trim().nullable().optional(),
});

function maskClaimedByUserForActor<
  T extends {
    claimedByUserId: string | null;
    claimedByUser: unknown;
    list: { userId: string } | null;
    userId: string;
  },
>(item: T, actorUserId: string) {
  const ownerUserId = item.list?.userId ?? item.userId;
  const canSee = canSeeClaimerIdentity({
    actorUserId,
    ownerUserId,
    claimerUserId: item.claimedByUserId,
    isClaimPrivate: true,
  });
  return {
    ...item,
    claimedByUser: canSee ? item.claimedByUser : null,
  };
}

// GET /api/items — элементы в подборках, доступных текущему пользователю
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  // Получаем userId один раз (устраняем дублирование)
  const currentUserId = await getSessionUserIdVerified();
  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 50,
    100
  );
  const userIdParam = searchParams.get("userId");
  const listIdParam = searchParams.get("listId");
  const search = searchParams.get("search")?.trim() || "";

  const conditions: Prisma.ItemWhereInput[] = [];

  if (cursor) {
    const [cursorDateRaw, cursorIdRaw] = cursor.split("|");
    const cursorDate = new Date(cursorDateRaw);
    const cursorId = cursorIdRaw?.trim();
    if (Number.isNaN(cursorDate.getTime())) {
      return NextResponse.json({ error: "Неверный курсор" }, { status: 400 });
    }
    if (cursorId) {
      conditions.push({
        OR: [
          { createdAt: { lt: cursorDate } },
          {
            AND: [
              { createdAt: cursorDate },
              { id: { lt: cursorId } },
            ],
          },
        ],
      });
    } else {
      // Backward compatibility for old cursor format (date only).
      conditions.push({ createdAt: { lt: cursorDate } });
    }
  }

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { tags: { some: { name: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  if (userIdParam === "me") {
    // "Мои" = элементы из моих подборок (owner подборки), а не автор карточки.
    conditions.push({ list: { userId: currentUserId } });
  } else if (userIdParam && userIdParam.trim() !== "") {
    conditions.push({ list: { userId: userIdParam.trim() } });
  }

  const listIdTrim = listIdParam?.trim() ?? "";
  // Устаревшее значение из старых ссылок — без фильтра по подборке
  if (listIdTrim !== "" && listIdTrim !== "all") {
    const canSee = await canUserSeeList(listIdTrim, currentUserId);
    if (!canSee) {
      return NextResponse.json({ items: [], pagination: { hasMore: false, nextCursor: null, limit } });
    }
    conditions.push({ listId: listIdTrim });
  } else {
    const visibleListIds = await getVisibleListIdsForUser(currentUserId);
    if (visibleListIds.length > 0) {
      conditions.push({ listId: { in: visibleListIds } });
    } else {
      return NextResponse.json(
        { items: [], pagination: { hasMore: false, nextCursor: null, limit } },
        { headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" } }
      );
    }
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const items = await prisma.item.findMany({
    where,
    include: {
      tags: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      claimedByUser: { select: { id: true, name: true, avatarUrl: true } },
      list: { select: { userId: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // Берем на 1 больше для проверки наличия следующей страницы
  });

  const hasMore = items.length > limit;
  const data = (hasMore ? items.slice(0, limit) : items).map((item) => {
    const masked = maskClaimedByUserForActor(item, currentUserId);
    return itemResponseWithoutList(masked);
  });
  const nextCursor =
    hasMore && data.length > 0
      ? `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}`
      : null;

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

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
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
        status: "AVAILABLE",
        userId,
        listId,
        tags: { connect: tagConnections },
      },
      include: {
        tags: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
        claimedByUser: { select: { id: true, name: true, avatarUrl: true } },
        list: { select: { userId: true } },
      },
    });
    const masked = maskClaimedByUserForActor(item, userId);
    return NextResponse.json(itemResponseWithoutList(masked), { status: 201 });
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
