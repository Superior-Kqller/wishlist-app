import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { z } from "zod";

const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username может содержать только буквы, цифры и _").optional(),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

const LAST_ADMIN_BLOCK = "LAST_ADMIN_BLOCK";

function adminAuthErrorResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "Forbidden";
  return NextResponse.json(
    { error: message || "Forbidden" },
    { status: message === "Unauthorized" ? 401 : 403 }
  );
}

/**
 * Запрет удаления последнего администратора или снятия роли ADMIN → USER с последнего админа.
 * Для PATCH с полем role: undefined (роль не меняется) вызывать не нужно.
 */
async function assertLastAdminSafe(
  userId: string,
  intent: "delete" | "demote_to_user"
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { ok: false, reason: "Пользователь не найден" };
    }

    if (user.role !== "ADMIN") {
      return { ok: true };
    }

    const adminCount = await tx.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return {
        ok: false,
        reason:
          intent === "delete"
            ? "Нельзя удалить последнего администратора"
            : "Нельзя снять роль с последнего администратора",
      };
    }

    return { ok: true };
  });
}

// GET /api/users/[id] — получение данных пользователя
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
  } catch (err: unknown) {
    return adminAuthErrorResponse(err);
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/users/[id] — обновление пользователя (только админы)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
  } catch (err: unknown) {
    return adminAuthErrorResponse(err);
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    if (data.role === "USER") {
      const lastAdmin = await assertLastAdminSafe(id, "demote_to_user");
      if (!lastAdmin.ok) {
        return NextResponse.json({ error: lastAdmin.reason }, { status: 400 });
      }
    }

    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Такой логин уже занят" },
          { status: 409 }
        );
      }
    }

    const updateData: {
      username?: string;
      name?: string;
      role?: "USER" | "ADMIN";
    } = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Нет полей для обновления" },
        { status: 400 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      if (updateData.role === "USER") {
        const currentUser = await tx.user.findUnique({
          where: { id },
          select: { role: true },
        });

        if (currentUser?.role === "ADMIN") {
          const adminCount = await tx.user.count({
            where: { role: "ADMIN" },
          });

          if (adminCount <= 1) {
            throw new Error(LAST_ADMIN_BLOCK);
          }
        }
      }

      return await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === LAST_ADMIN_BLOCK) {
      return NextResponse.json(
        { error: "Нельзя снять роль с последнего администратора" },
        { status: 400 }
      );
    }
    sanitizeError("Update user error", err, { userId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] — удаление пользователя (только админы)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();
  } catch (err: unknown) {
    return adminAuthErrorResponse(err);
  }

  const { id } = await params;

  const precheck = await assertLastAdminSafe(id, "delete");
  if (!precheck.ok) {
    return NextResponse.json({ error: precheck.reason }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (user?.role === "ADMIN") {
        const adminCount = await tx.user.count({
          where: { role: "ADMIN" },
        });

        if (adminCount <= 1) {
          throw new Error(LAST_ADMIN_BLOCK);
        }
      }

      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === LAST_ADMIN_BLOCK) {
      return NextResponse.json(
        { error: "Нельзя удалить последнего администратора" },
        { status: 400 }
      );
    }
    sanitizeError("Delete user error", err, { userId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
