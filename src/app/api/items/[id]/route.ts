import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getTagColor } from "@/lib/utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { canUserSeeItem } from "@/lib/list-utils";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  canClaimItem,
  canSeeClaimerIdentity,
  canUnclaimItem,
} from "@/lib/access-policy";
import {
  canTransitionStatus,
  hasConflictingStatusPayload,
} from "@/lib/item-status";
import { notifyStatusTransition } from "@/lib/telegram/notifications";
import { itemResponseWithoutList } from "@/lib/item-json";

const updateItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  url: z.string().url().optional().or(z.literal("")).or(z.null()),
  price: z.number().min(0).optional().or(z.null()),
  currency: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  images: z.array(z.string().url()).max(1).optional(),
  notes: z.string().max(2000).optional().or(z.null()),
  purchased: z.boolean().optional(),
  status: z.enum(["AVAILABLE", "CLAIMED", "PURCHASED"]).optional(),
  tags: z.array(z.string()).optional(),
  listId: z.string().trim().nullable().optional(),
});

function maskClaimedByUserForActor<
  T extends {
    claimedByUserId: string | null;
    claimedByUser: unknown;
    list: { userId: string } | null;
    userId: string;
  },
>(item: T, actorUserId: string) {
  const ownerUserId = item.list?.userId ?? item.userId;
  const canSee = canSeeClaimerIdentity({
    actorUserId,
    ownerUserId,
    claimerUserId: item.claimedByUserId,
    isClaimPrivate: true,
  });
  return {
    ...item,
    claimedByUser: canSee ? item.claimedByUser : null,
  };
}

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
    include: {
      tags: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      claimedByUser: { select: { id: true, name: true, avatarUrl: true } },
      list: { select: { userId: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const masked = maskClaimedByUserForActor(item, userId);
  return NextResponse.json(itemResponseWithoutList(masked));
}

// PATCH /api/items/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      tags: true,
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
        { status: 400 }
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
      data.tags !== undefined ||
      data.listId !== undefined;
    const hasNonStatusFields = hasOwnerOnlyFields || data.purchased !== undefined;

    if (data.status !== undefined && hasNonStatusFields) {
      return NextResponse.json(
        { error: "Операция смены status должна быть отдельным запросом" },
        { status: 400 }
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

    if (data.purchased !== undefined) {
      if (!isOwner) {
        return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
      }
      updateData.purchased = data.purchased;
      updateData.purchasedAt = data.purchased ? new Date() : null;
      updateData.status = data.purchased ? "PURCHASED" : "AVAILABLE";
      if (!data.purchased) {
        updateData.claimedByUserId = null;
        updateData.claimedAt = null;
      }
    }

    if (data.status !== undefined) {
      const currentStatus = existing.status;
      const nextStatus = data.status;
      const claimerUserId = existing.claimedByUserId;

      if (
        nextStatus === "CLAIMED" &&
        !canClaimItem({
          actorUserId: userId,
          ownerUserId: existing.userId,
          claimerUserId,
          isVisibleToActor: true,
          status: currentStatus,
        })
      ) {
        return NextResponse.json(
          { error: "Нельзя забронировать этот товар" },
          { status: 409 }
        );
      }

      if (
        nextStatus === "AVAILABLE" &&
        !canUnclaimItem({
          actorUserId: userId,
          ownerUserId: existing.userId,
          claimerUserId,
          isVisibleToActor: true,
          status: currentStatus,
        })
      ) {
        return NextResponse.json(
          { error: "Нельзя снять бронь для этого товара" },
          { status: 403 }
        );
      }

      if (
        !canTransitionStatus(currentStatus, nextStatus, {
          actorUserId: userId,
          ownerUserId: existing.userId,
          claimerUserId,
        })
      ) {
        return NextResponse.json(
          { error: "Недопустимый переход статуса" },
          { status: 409 }
        );
      }

      const now = new Date();
      const atomicUpdateData: Prisma.ItemUncheckedUpdateInput = {
        status: nextStatus,
      };

      if (nextStatus === "CLAIMED") {
        atomicUpdateData.claimedByUserId = userId;
        atomicUpdateData.claimedAt = now;
        atomicUpdateData.purchased = false;
        atomicUpdateData.purchasedAt = null;
      } else if (nextStatus === "AVAILABLE") {
        atomicUpdateData.claimedByUserId = null;
        atomicUpdateData.claimedAt = null;
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
            status: currentStatus,
            claimedByUserId:
              currentStatus === "CLAIMED" ? claimerUserId : existing.claimedByUserId,
          },
          data: atomicUpdateData,
        });
        if (result.count !== 1) return null;

        return tx.item.findUnique({
          where: { id },
          include: {
            tags: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
            claimedByUser: { select: { id: true, name: true, avatarUrl: true } },
            list: { select: { userId: true } },
          },
        });
      });

      if (!updated) {
        return NextResponse.json(
          { error: "Состояние товара изменилось, обновите страницу" },
          { status: 409 }
        );
      }

      await notifyStatusTransition({
        itemId: updated.id,
        itemTitle: updated.title,
        ownerUserId: updated.userId,
        actorUserId: userId,
        previousStatus: existing.status,
        nextStatus: updated.status,
        previousClaimerUserId: existing.claimedByUserId,
        nextClaimerUserId: updated.claimedByUserId,
      });

      const masked = maskClaimedByUserForActor(updated, userId);
      return NextResponse.json(itemResponseWithoutList(masked));
    }

    if (data.listId !== undefined) {
      if (data.listId) {
        const list = await prisma.list.findUnique({
          where: { id: data.listId },
          select: { userId: true },
        });
        if (!list || list.userId !== userId) {
          return NextResponse.json({ error: "Подборка не найдена или доступ запрещён" }, { status: 400 });
        }
      }
      updateData.listId = data.listId || null;
    }

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
        set: [],
        connect: tagConnections,
      };
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
        claimedByUser: { select: { id: true, name: true, avatarUrl: true } },
        list: { select: { userId: true } },
      },
    });

    if (existing.status !== item.status) {
      await notifyStatusTransition({
        itemId: item.id,
        itemTitle: item.title,
        ownerUserId: item.userId,
        actorUserId: userId,
        previousStatus: existing.status,
        nextStatus: item.status,
        previousClaimerUserId: existing.claimedByUserId,
        nextClaimerUserId: item.claimedByUserId,
      });
    }

    const masked = maskClaimedByUserForActor(item, userId);
    return NextResponse.json(itemResponseWithoutList(masked));
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
