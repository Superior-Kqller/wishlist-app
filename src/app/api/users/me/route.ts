import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { normalizeAvatarUrl } from "@/lib/avatar-url-policy";
import { inferTelegramLinkStatus } from "@/lib/telegram/link-status";
import { normalizeGiftPreferences, giftPreferencesSchema } from "@/lib/preferences";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isValidCalendarDate } from "@/lib/calendar/local-date";

const telegramIdSchema = z.string().trim().regex(/^\d{5,20}$/);
const birthdayAudienceSchema = z.enum(["ALL", "SELECTED", "PRIVATE"]);
const birthdaySchema = z
  .object({
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900).max(new Date().getFullYear()).nullable(),
    audience: birthdayAudienceSchema,
    selectedViewerIds: z.array(z.string().min(1)).max(200).default([]),
  })
  .superRefine((birthday, context) => {
    const validationYear = birthday.year ?? 2000;
    if (!isValidCalendarDate(validationYear, birthday.month, birthday.day)) {
      context.addIssue({
        code: "custom",
        message: "Несуществующая дата рождения",
        path: ["day"],
      });
    }
  });

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().max(2048).optional(),
  telegramId: z.union([telegramIdSchema, z.literal(""), z.null()]).optional(),
  telegramNotificationsEnabled: z.boolean().optional(),
  giftPreferences: giftPreferencesSchema.optional(),
  birthday: z.union([birthdaySchema, z.null()]).optional(),
});

function hasOwnPasswordField(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, "password")
  );
}

function birthdayProfileResponse(user: {
  birthdayDay: number | null;
  birthdayMonth: number | null;
  birthdayYear: number | null;
  birthdayAudience: "ALL" | "SELECTED" | "PRIVATE";
  birthdayViewers?: Array<{ viewerId: string }>;
}) {
  if (user.birthdayDay == null || user.birthdayMonth == null) return null;
  return {
    day: user.birthdayDay,
    month: user.birthdayMonth,
    year: user.birthdayYear,
    audience: user.birthdayAudience,
    selectedViewerIds: (user.birthdayViewers ?? []).map((entry) => entry.viewerId),
  };
}

// GET /api/users/me — данные текущего пользователя
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
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
      giftPreferences: true,
      birthdayDay: true,
      birthdayMonth: true,
      birthdayYear: true,
      birthdayAudience: true,
      birthdayViewers: { select: { viewerId: true } },
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
    giftPreferences: normalizeGiftPreferences(user.giftPreferences),
    birthday: birthdayProfileResponse(user),
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

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (hasOwnPasswordField(body)) {
      return NextResponse.json(
        { error: "Для смены пароля используйте отдельную форму" },
        { status: 400 }
      );
    }

    const data = updateProfileSchema.parse(body);

    const updateData: {
      name?: string;
      avatarUrl?: string | null;
      telegramId?: string | null;
      telegramUsername?: string | null;
      telegramLinkedAt?: Date | null;
      telegramConfirmedAt?: Date | null;
      telegramNotificationsEnabled?: boolean;
      giftPreferences?: Prisma.InputJsonValue;
      birthdayDay?: number | null;
      birthdayMonth?: number | null;
      birthdayYear?: number | null;
      birthdayAudience?: "ALL" | "SELECTED" | "PRIVATE";
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
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

    if (data.giftPreferences !== undefined) {
      updateData.giftPreferences = normalizeGiftPreferences(data.giftPreferences);
    }

    if (data.birthday !== undefined) {
      updateData.birthdayDay = data.birthday?.day ?? null;
      updateData.birthdayMonth = data.birthday?.month ?? null;
      updateData.birthdayYear = data.birthday?.year ?? null;
      updateData.birthdayAudience = data.birthday?.audience ?? "PRIVATE";
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

    const userSelect = {
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
      giftPreferences: true,
      birthdayDay: true,
      birthdayMonth: true,
      birthdayYear: true,
      birthdayAudience: true,
      birthdayViewers: { select: { viewerId: true } },
      createdAt: true,
      updatedAt: true,
    } as const;

    const user =
      data.birthday === undefined
        ? await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: userSelect,
          })
        : await prisma.$transaction(async (tx) => {
            const selectedViewerIds =
              data.birthday?.audience === "SELECTED"
                ? [...new Set(data.birthday.selectedViewerIds)].filter((id) => id !== userId)
                : [];

            if (selectedViewerIds.length > 0) {
              const viewers = await tx.user.findMany({
                where: { id: { in: selectedViewerIds } },
                select: { id: true },
              });
              if (viewers.length !== selectedViewerIds.length) {
                throw new Error("INVALID_BIRTHDAY_VIEWERS");
              }
            }

            await tx.birthdayViewer.deleteMany({ where: { ownerId: userId } });
            if (selectedViewerIds.length > 0) {
              await tx.birthdayViewer.createMany({
                data: selectedViewerIds.map((viewerId) => ({ ownerId: userId, viewerId })),
              });
            }

            return tx.user.update({
              where: { id: userId },
              data: updateData,
              select: userSelect,
            });
          });

    return NextResponse.json({
      ...user,
      giftPreferences: normalizeGiftPreferences(user.giftPreferences),
      birthday: birthdayProfileResponse(user),
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

    if (err instanceof Error && err.message === "INVALID_BIRTHDAY_VIEWERS") {
      return NextResponse.json({ error: "Некорректная аудитория события" }, { status: 400 });
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
