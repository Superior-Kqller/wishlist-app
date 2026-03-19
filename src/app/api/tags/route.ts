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

    const tags = await prisma.tag.findMany({
      where: {
        items: {
          some: {
            listId: { in: visibleListIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            items: {
              where: {
                listId: { in: visibleListIds },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

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
