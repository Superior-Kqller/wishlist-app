import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeItem } from "@/lib/list-utils";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { canTransitionStatus, hasConflictingStatusPayload } from "@/lib/item-status";
import { notifyStatusTransition } from "@/lib/telegram/notifications";
import { normalizeProductCategory } from "@/lib/categories";

const updateItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  url: z.string().url().optional().or(z.literal("")).or(z.null()),
  price: z.number().min(0).optional().or(z.null()),
  currency: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  images: z.array(z.string().url()).max(1).optional(),
  notes: z.string().max(2000).optional().or(z.null()),
  purchased: z.boolean().optional(),
  status: z.enum(["AVAILABLE", "PURCHASED"]).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  listId: z.string().trim().nullable().optional(),
});

// GET /api/items/[id] — только если пользователь имеет доступ (через подборку)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PATCH /api/items/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
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

  const existing = await prisma.item.findFirst({
    where: { id },
    include: {
      list: { select: { userId: true, viewers: { select: { userId: true } } } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  const isOwner = existing.userId === userId;

  try {
    const body = await req.json();
    const data = updateItemSchema.parse(body);

    if (
      hasConflictingStatusPayload({
        status: data.status,
        purchased: data.purchased,
      })
    ) {
      return NextResponse.json(
        { error: "Нельзя одновременно передавать status и purchased" },
        { status: 400 },
      );
    }

    const updateData: Prisma.ItemUncheckedUpdateInput = {};
    const hasOwnerOnlyFields =
      data.title !== undefined ||
      data.url !== undefined ||
      data.price !== undefined ||
      data.currency !== undefined ||
      data.priority !== undefined ||
      data.images !== undefined ||
      data.notes !== undefined ||
      data.category !== undefined ||
      data.listId !== undefined;
    const hasNonStatusFields = hasOwnerOnlyFields || data.purchased !== undefined;

    if (data.status !== undefined && hasNonStatusFields) {
      return NextResponse.json(
        { error: "Операция смены status должна быть отдельным запросом" },
        { status: 400 },
      );
    }

    if (hasOwnerOnlyFields && !isOwner) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.category !== undefined) {
      updateData.category = normalizeProductCategory(data.category);
    }

    if (data.purchased !== undefined) {
      if (!isOwner) {
        return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
      }
      updateData.purchased = data.purchased;
      updateData.purchasedAt = data.purchased ? new Date() : null;
      updateData.status = data.purchased ? "PURCHASED" : "AVAILABLE";
    }

    if (data.status !== undefined) {
      const nextStatus = data.status;

      if (
        !canTransitionStatus(existing.status, nextStatus, {
          actorUserId: userId,
          ownerUserId: existing.userId,
        })
      ) {
        return NextResponse.json({ error: "Недопустимый переход статуса" }, { status: 409 });
      }

      const now = new Date();
      const atomicUpdateData: Prisma.ItemUncheckedUpdateInput = {
        status: nextStatus,
      };

      if (nextStatus === "AVAILABLE") {
        atomicUpdateData.purchased = false;
        atomicUpdateData.purchasedAt = null;
      } else if (nextStatus === "PURCHASED") {
        atomicUpdateData.purchased = true;
        atomicUpdateData.purchasedAt = now;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.item.updateMany({
          where: {
            id,
            status: existing.status,
          },
          data: atomicUpdateData,
        });
        if (result.count !== 1) return null;

        return tx.item.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        });
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Состояние товара изменилось, обновите страницу" },
          { status: 409 },
        );
      }

      await notifyStatusTransition({
        itemId: updated.id,
        itemTitle: updated.title,
        ownerUserId: updated.userId,
        actorUserId: userId,
        nextStatus: updated.status,
      });

      return NextResponse.json(updated);
    }

    if (data.listId !== undefined) {
      if (data.listId) {
        const list = await prisma.list.findUnique({
          where: { id: data.listId },
          select: { userId: true },
        });
        if (!list || list.userId !== userId) {
          return NextResponse.json(
            { error: "Подборка не найдена или доступ запрещён" },
            { status: 400 },
          );
        }
      }
      updateData.listId = data.listId || null;
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (existing.status !== item.status) {
      await notifyStatusTransition({
        itemId: item.id,
        itemTitle: item.title,
        ownerUserId: item.userId,
        actorUserId: userId,
        nextStatus: item.status,
      });
    }

    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 },
      );
    }

    sanitizeError("Update item error", err, { userId, itemId: id });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// DELETE /api/items/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
