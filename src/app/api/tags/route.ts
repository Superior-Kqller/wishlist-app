import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getVisibleListIdsForUser } from "@/lib/list-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";

// GET /api/tags — теги только по товарам в подборках, доступных текущему пользователю
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
      return NextResponse.json([], {
        headers: {
          "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const items = await prisma.item.findMany({
      where: { listId: { in: visibleListIds } },
      select: {
        tags: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    const byId = new Map<
      string,
      { id: string; name: string; color: string; _count: { items: number } }
    >();

    for (const item of items) {
      for (const t of item.tags) {
        const prev = byId.get(t.id);
        if (prev) {
          prev._count.items += 1;
        } else {
          byId.set(t.id, {
            id: t.id,
            name: t.name,
            color: t.color,
            _count: { items: 1 },
          });
        }
      }
    }

    const tags = [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "ru")
    );

    return NextResponse.json(tags, {
      headers: {
        "Cache-Control": "private, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    sanitizeError("Get tags error", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
