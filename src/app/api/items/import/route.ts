import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { normalizeProductCategory } from "@/lib/categories";

const importItemSchema = z.object({
  title: z.string().trim().min(1).max(500),
  url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  price: z.number().min(0).nullable().optional(),
  currency: z.string().trim().min(1).max(10).default("RUB"),
  priority: z.number().int().min(1).max(5).default(3),
  images: z.array(z.string().url()).max(1).default([]),
  category: z.string().trim().max(80).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  purchased: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  purchasedAt: z.string().datetime().optional(),
});

const importPayloadSchema = z.union([
  z.array(importItemSchema).min(1).max(500),
  z.object({
    listId: z.string().trim().min(1).nullable().optional(),
    items: z.array(importItemSchema).min(1).max(500),
  }),
]);

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const parsed = importPayloadSchema.parse(rawBody);
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    const listId = Array.isArray(parsed) ? null : (parsed.listId ?? null);

    if (listId) {
      const list = await prisma.list.findUnique({
        where: { id: listId },
        select: { userId: true },
      });
      if (!list || list.userId !== userId) {
        return NextResponse.json(
          { error: "Подборка не найдена или доступ запрещён" },
          { status: 400 },
        );
      }
    }

    for (const item of items) {
      const createdAt = parseDate(item.createdAt);
      const purchasedAt = item.purchased
        ? parseDate(item.purchasedAt) ?? createdAt ?? new Date()
        : null;

      await prisma.item.create({
        data: {
          title: item.title,
          url: item.url || null,
          price: item.price ?? null,
          currency: item.currency,
          priority: item.priority,
          images: item.images,
          notes: item.notes || null,
          category: normalizeProductCategory(item.category),
          purchased: item.purchased,
          purchasedAt,
          status: item.purchased ? "PURCHASED" : "AVAILABLE",
          userId,
          listId,
          ...(createdAt ? { createdAt } : {}),
        },
      });
    }

    return NextResponse.json({ imported: items.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 },
      );
    }
    sanitizeError("Import items error", err, { userId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
