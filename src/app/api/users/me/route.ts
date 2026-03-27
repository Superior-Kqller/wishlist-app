import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { passwordSchema } from "@/lib/password-validation";
import { normalizeAvatarUrl } from "@/lib/avatar-url-policy";
import { inferTelegramLinkStatus } from "@/lib/telegram/link-status";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const telegramIdSchema = z.string().trim().regex(/^\d{5,20}$/);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  password: passwordSchema.optional(),
  avatarUrl: z.string().max(2048).optional(),
  telegramId: z.union([telegramIdSchema, z.literal(""), z.null()]).optional(),
  telegramNotificationsEnabled: z.boolean().optional(),
});

// GET /api/users/me — данные текущего пользователя
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      role: true,
      telegramId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      telegramConfirmedAt: true,
      telegramNotificationsEnabled: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    telegramLinkStatus: inferTelegramLinkStatus({
      telegramId: user.telegramId,
      telegramConfirmedAt: user.telegramConfirmedAt,
    }),
  });
}

// PATCH /api/users/me — обновление своего профиля
export async function PATCH(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const updateData: {
      name?: string;
      password?: string;
      avatarUrl?: string | null;
      telegramId?: string | null;
      telegramUsername?: string | null;
      telegramLinkedAt?: Date | null;
      telegramConfirmedAt?: Date | null;
      telegramNotificationsEnabled?: boolean;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.password !== undefined) {
      const hashedPassword = await bcrypt.hash(data.password, 12);
      updateData.password = hashedPassword;
    }

    if (data.avatarUrl !== undefined) {
      const normalizedAvatarUrl = normalizeAvatarUrl(data.avatarUrl);
      if (!normalizedAvatarUrl.ok) {
        return NextResponse.json(
          { error: "Некорректный avatarUrl" },
          { status: 400 }
        );
      }

      updateData.avatarUrl = normalizedAvatarUrl.value;
    }

    if (data.telegramNotificationsEnabled !== undefined) {
      updateData.telegramNotificationsEnabled = data.telegramNotificationsEnabled;
    }

    if (data.telegramId !== undefined) {
      const nextTelegramId =
        data.telegramId === "" || data.telegramId === null
          ? null
          : data.telegramId;

      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });

      if (!current) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (current.telegramId !== nextTelegramId) {
        updateData.telegramId = nextTelegramId;
        updateData.telegramUsername = null;
        updateData.telegramConfirmedAt = null;
        updateData.telegramLinkedAt = nextTelegramId ? new Date() : null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Нет полей для обновления" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
        telegramConfirmedAt: true,
        telegramNotificationsEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ...user,
      telegramLinkStatus: inferTelegramLinkStatus({
        telegramId: user.telegramId,
        telegramConfirmedAt: user.telegramConfirmedAt,
      }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Этот Telegram ID уже привязан к другому аккаунту" },
        { status: 409 }
      );
    }

    sanitizeError("Update profile error", err, { userId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

