import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTagColor } from "@/lib/utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeItem } from "@/lib/list-utils";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const updateItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  url: z.string().url().optional().or(z.literal("")).or(z.null()),
  price: z.number().min(0).optional().or(z.null()),
  currency: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  images: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional().or(z.null()),
  purchased: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  listId: z.string().trim().nullable().optional(),
});

// GET /api/items/[id] — только если пользователь имеет доступ (через подборку)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  const canSee = await canUserSeeItem(id, userId);
  if (!canSee) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const item = await prisma.item.findFirst({
    where: { id },
    include: { tags: true, user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PATCH /api/items/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    include: { tags: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = updateItemSchema.parse(body);

    const updateData: Prisma.ItemUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.purchased !== undefined) {
      updateData.purchased = data.purchased;
      updateData.purchasedAt = data.purchased ? new Date() : null;
    }
    if (data.listId !== undefined) {
      if (data.listId) {
        const list = await prisma.list.findUnique({ where: { id: data.listId }, select: { userId: true } });
        if (!list || list.userId !== userId) {
          return NextResponse.json({ error: "Подборка не найдена или доступ запрещён" }, { status: 400 });
        }
      }
      updateData.listId = data.listId || null;
    }

    // Handle tags
    if (data.tags !== undefined) {
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

      updateData.tags = {
        set: [], // disconnect all
        connect: tagConnections,
      };
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: { tags: true, user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Update item error", err, { userId, itemId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.item.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
