import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getVisibleListIdsForUser } from "@/lib/list-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { normalizeGiftPreferences } from "@/lib/preferences";

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
        giftPreferences: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const items = await prisma.item.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        listId: { in: visibleListIds },
      },
      select: {
        id: true,
        title: true,
        userId: true,
        price: true,
        currency: true,
        purchased: true,
        priority: true,
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
      const priorityCounts: Record<string, number> = {};

      userItems.forEach((item) => {
        priorityCounts[item.priority] = (priorityCounts[item.priority] ?? 0) + 1;
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

      const sortedCurrencies = Object.keys(pricesByCurrency).sort((a, b) =>
        a.localeCompare(b),
      );
      const mainCurrency = sortedCurrencies[0] || "RUB";
      const mainStats = pricesByCurrency[mainCurrency] || {
        unpurchased: 0,
        purchased: 0,
      };

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        giftPreferences: normalizeGiftPreferences(user.giftPreferences),
        stats: {
          totalItems,
          unpurchasedItems,
          totalWishlistValue: mainStats.unpurchased,
          totalPurchasedValue: mainStats.purchased,
          currency: mainCurrency,
          pricesByCurrency,
          priorityCounts,
        },
      };
    });

    const summaryPricesByCurrency: Record<string, { unpurchased: number; purchased: number }> =
      {};
    const summaryPriorityCounts: Record<string, number> = {};
    for (const item of items) {
      summaryPriorityCounts[item.priority] =
        (summaryPriorityCounts[item.priority] ?? 0) + 1;
      if (!item.price) continue;
      const currency = item.currency || "RUB";
      if (!summaryPricesByCurrency[currency]) {
        summaryPricesByCurrency[currency] = { unpurchased: 0, purchased: 0 };
      }
      if (item.purchased) {
        summaryPricesByCurrency[currency].purchased += item.price;
      } else {
        summaryPricesByCurrency[currency].unpurchased += item.price;
      }
    }

    const userNameById = new Map(users.map((user) => [user.id, user.name]));
    const topItems = items
      .filter((item) => !item.purchased && item.price != null)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price ?? 0,
        currency: item.currency || "RUB",
        priority: item.priority,
        userId: item.userId,
        userName: userNameById.get(item.userId) ?? "",
      }));

    const summary = {
      totalItems: items.length,
      unpurchasedItems: items.filter((item) => !item.purchased).length,
      memberCount: users.length,
      pricesByCurrency: summaryPricesByCurrency,
      priorityCounts: summaryPriorityCounts,
      topItems,
    };

    return NextResponse.json(
      { users: usersWithStats, summary },
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
