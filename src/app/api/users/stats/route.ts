import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { selectTopItems } from "@/lib/stats-top-items";
import { normalizeGiftPreferences } from "@/lib/preferences";
import { unauthorizedResponse } from "@/lib/api-responses";

type StatsItem = {
  price: number | null;
  currency: string | null;
  purchased: boolean;
  priority: number;
};

/** Счётчики и суммы по валютам — одни и те же для участника и для всего круга. */
function tally(items: StatsItem[]) {
  const pricesByCurrency: Record<string, { unpurchased: number; purchased: number }> = {};
  const priorityCounts: Record<string, number> = {};
  for (const item of items) {
    priorityCounts[item.priority] = (priorityCounts[item.priority] ?? 0) + 1;
    if (!item.price) continue;
    const totals = (pricesByCurrency[item.currency || "RUB"] ??= { unpurchased: 0, purchased: 0 });
    totals[item.purchased ? "purchased" : "unpurchased"] += item.price;
  }
  return {
    totalItems: items.length,
    unpurchasedItems: items.filter((item) => !item.purchased).length,
    pricesByCurrency,
    priorityCounts,
  };
}

// GET /api/users/stats — статистика по пользователям из «круга» общих подборок
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const lists = await prisma.list.findMany({
      where: {
        OR: [{ userId }, { viewers: { some: { userId } } }],
      },
      select: {
        id: true,
        userId: true,
        viewers: { select: { userId: true } },
      },
    });

    if (lists.length === 0) {
      return NextResponse.json(
        { users: [] },
        {
          headers: {
            "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
          },
        },
      );
    }

    const visibleListIds = lists.map((l) => l.id);

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
    const itemsByUserId = Map.groupBy(items, (item) => item.userId);

    const usersWithStats = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      giftPreferences: normalizeGiftPreferences(user.giftPreferences),
      stats: tally(itemsByUserId.get(user.id) ?? []),
    }));

    const userNameById = new Map(users.map((user) => [user.id, user.name]));
    const topItems = selectTopItems(items).map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price ?? 0,
      currency: item.currency || "RUB",
      priority: item.priority,
      userId: item.userId,
      userName: userNameById.get(item.userId) ?? "",
    }));

    const summary = {
      ...tally(items),
      memberCount: users.length,
      topItems,
    };

    return NextResponse.json(
      { users: usersWithStats, summary },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    sanitizeError("Get users stats error", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
