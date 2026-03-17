import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";

// GET /api/users/stats — статистика по всем пользователям
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Получаем всех пользователей с их товарами
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        items: {
          select: {
            price: true,
            currency: true,
            purchased: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Вычисляем статистику для каждого пользователя
    const usersWithStats = users.map((user) => {
      const totalItems = user.items.length;
      const unpurchasedItems = user.items.filter((item) => !item.purchased).length;
      
      // Суммируем стоимость по валютам отдельно
      const pricesByCurrency: Record<string, { unpurchased: number; purchased: number }> = {};
      
      user.items.forEach((item) => {
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

      // Для простоты возвращаем основную валюту (RUB) или первую найденную
      const mainCurrency = Object.keys(pricesByCurrency)[0] || "RUB";
      const mainStats = pricesByCurrency[mainCurrency] || { unpurchased: 0, purchased: 0 };

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
          pricesByCurrency, // Дополнительная информация по валютам
        },
      };
    });

    // Кэширование на 1 минуту (статистика меняется реже)
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
