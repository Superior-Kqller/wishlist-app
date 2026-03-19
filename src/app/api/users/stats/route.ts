import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getVisibleListIdsForUser } from "@/lib/list-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";

// GET /api/users/stats — статистика по пользователям из «круга» общих подборок
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const visibleListIds = await getVisibleListIdsForUser(userId);

    if (visibleListIds.length === 0) {
      return NextResponse.json(
        { users: [] },
        {
          headers: {
            "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    const lists = await prisma.list.findMany({
      where: { id: { in: visibleListIds } },
      select: {
        userId: true,
        viewers: { select: { userId: true } },
      },
    });

    const circleIds = new Set<string>([userId]);
    for (const list of lists) {
      circleIds.add(list.userId);
      for (const v of list.viewers) {
        circleIds.add(v.userId);
      }
    }

    const users = await prisma.user.findMany({
      where: { id: { in: [...circleIds] } },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const items = await prisma.item.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        listId: { in: visibleListIds },
      },
      select: {
        userId: true,
        price: true,
        currency: true,
        purchased: true,
      },
    });
    const itemsByUserId = new Map<string, typeof items>();
    for (const item of items) {
      const arr = itemsByUserId.get(item.userId);
      if (arr) arr.push(item);
      else itemsByUserId.set(item.userId, [item]);
    }

    const usersWithStats = users.map((user) => {
      const userItems = itemsByUserId.get(user.id) || [];
      const totalItems = userItems.length;
      const unpurchasedItems = userItems.filter((item) => !item.purchased).length;

      const pricesByCurrency: Record<string, { unpurchased: number; purchased: number }> =
        {};

      userItems.forEach((item) => {
        if (!item.price) return;
        const currency = item.currency || "RUB";
        if (!pricesByCurrency[currency]) {
          pricesByCurrency[currency] = { unpurchased: 0, purchased: 0 };
        }
        if (item.purchased) {
          pricesByCurrency[currency].purchased += item.price;
        } else {
          pricesByCurrency[currency].unpurchased += item.price;
        }
      });

      const mainCurrency = Object.keys(pricesByCurrency)[0] || "RUB";
      const mainStats = pricesByCurrency[mainCurrency] || {
        unpurchased: 0,
        purchased: 0,
      };

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        stats: {
          totalItems,
          unpurchasedItems,
          totalWishlistValue: mainStats.unpurchased,
          totalPurchasedValue: mainStats.purchased,
          currency: mainCurrency,
          pricesByCurrency,
        },
      };
    });

    return NextResponse.json(
      { users: usersWithStats },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    sanitizeError("Get users stats error", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
