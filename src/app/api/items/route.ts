import { after, NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeList, getVisibleListIdsForUser } from "@/lib/list-utils";
import { notifyItemCreated } from "@/lib/telegram/notifications";
import { createItemSchema, createWishlistItem } from "@/lib/wishlist/create-item";
import {
  buildWishlistCursorCondition,
  encodeWishlistCursor,
  getWishlistOrderBy,
  InvalidWishlistCursorError,
  parseWishlistSort,
} from "@/lib/wishlist/item-sort";
import {
  buildCategoryCondition,
  buildPurchasedCondition,
  parseCategoriesParam,
} from "@/lib/wishlist/item-filters";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { unauthorizedResponse } from "@/lib/api-responses";

// GET /api/items — элементы в подборках, доступных текущему пользователю
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  // Получаем userId один раз (устраняем дублирование)
  const currentUserId = await getSessionUserIdVerified();
  if (!currentUserId) {
    return unauthorizedResponse();
  }

  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const limitRaw = parseInt(searchParams.get("limit") || "50", 10);
  const limit = Math.min(
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 50,
    100,
  );
  const userIdParam = searchParams.get("userId");
  const listIdParam = searchParams.get("listId");
  const search = searchParams.get("search")?.trim() || "";
  const sort = parseWishlistSort(searchParams.get("sort"));
  const showPurchased = searchParams.get("purchased") === "show";
  const categories = parseCategoriesParam(searchParams.get("categories"));

  const conditions: Prisma.ItemWhereInput[] = [];

  if (cursor) {
    try {
      conditions.push(buildWishlistCursorCondition(sort, cursor));
    } catch (err) {
      if (err instanceof InvalidWishlistCursorError) {
        return NextResponse.json({ error: "Неверный курсор" }, { status: 400 });
      }
      throw err;
    }
  }

  const purchasedCondition = buildPurchasedCondition(showPurchased);
  if (purchasedCondition) conditions.push(purchasedCondition);

  const categoryCondition = buildCategoryCondition(categories);
  if (categoryCondition) conditions.push(categoryCondition);

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
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
      return NextResponse.json({
        items: [],
        pagination: { hasMore: false, nextCursor: null, limit },
      });
    }
    conditions.push({ listId: listIdTrim });
  } else {
    const visibleListIds = await getVisibleListIdsForUser(currentUserId);
    if (visibleListIds.length > 0) {
      conditions.push({
        OR: [{ listId: { in: visibleListIds } }, { listId: null, userId: currentUserId }],
      });
    } else {
      conditions.push({ listId: null, userId: currentUserId });
    }
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const items = await prisma.item.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: getWishlistOrderBy(sort),
    take: limit + 1, // Берем на 1 больше для проверки наличия следующей страницы
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && data.length > 0 ? encodeWishlistCursor(sort, data[data.length - 1]) : null;

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
    },
  );
}

// POST /api/items
export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const data = createItemSchema.parse(body);

    const item = await createWishlistItem(userId, data);
    if (!item) {
      return NextResponse.json(
        { error: "Подборка не найдена или доступ запрещён" },
        { status: 400 },
      );
    }
    /*
     * Желание уже записано — ответ не ждёт Telegram. Раньше внешний сервис
     * стоял между записью и ответом: его задержка становилась задержкой
     * сохранения, хотя на судьбу желания она не влияет.
     */
    after(() =>
      notifyItemCreated({
        itemId: item.id,
        itemTitle: item.title,
        actorUserId: userId,
        actorName: item.user?.name ?? "Пользователь",
      }),
    );
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 },
      );
    }
    sanitizeError("Create item error", err, { userId });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
