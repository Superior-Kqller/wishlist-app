import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { z } from "zod";

const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username может содержать только буквы, цифры и _").optional(),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

/**
 * Проверить, можно ли удалить/изменить роль пользователя
 * Запрещено удалять/менять роль последнего админа
 * Использует транзакцию для предотвращения race condition
 */
async function canModifyUser(userId: string, newRole?: "USER" | "ADMIN"): Promise<{ allowed: boolean; reason?: string }> {
  // Используем транзакцию для атомарной проверки
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { allowed: false, reason: "User not found" };
    }

    // Если пользователь не админ, можно изменять
    if (user.role !== "ADMIN") {
      return { allowed: true };
    }

    // Если пытаемся изменить роль админа на USER или удалить админа
    // Если newRole === "ADMIN" или не указан при обновлении без изменения роли - разрешаем
    const isRemovingAdmin = newRole === "USER" || newRole === undefined; // undefined означает удаление

    if (isRemovingAdmin) {
      // Подсчитать количество админов атомарно в транзакции
      const adminCount = await tx.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return {
          allowed: false,
          reason: "Cannot remove the last admin",
        };
      }
    }

    return { allowed: true };
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Forbidden" },
      { status: err.message === "Unauthorized" ? 401 : 403 }
    );
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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Forbidden" },
      { status: err.message === "Unauthorized" ? 401 : 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    // Проверка возможности изменения (внутри транзакции)
    const canModify = await canModifyUser(id, data.role);
    if (!canModify.allowed) {
      return NextResponse.json(
        { error: canModify.reason },
        { status: 400 }
      );
    }

    // Проверка уникальности username, если изменяется
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

    // Используем транзакцию для атомарного обновления с проверкой последнего админа
    const user = await prisma.$transaction(async (tx) => {
      // Повторная проверка в транзакции перед обновлением (защита от race condition)
      if (updateData.role === "USER" || updateData.role === undefined) {
        const currentUser = await tx.user.findUnique({
          where: { id },
          select: { role: true },
        });
        
        if (currentUser?.role === "ADMIN") {
          const adminCount = await tx.user.count({
            where: { role: "ADMIN" },
          });
          
          if (adminCount <= 1) {
            throw new Error("Cannot remove the last admin");
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
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Forbidden" },
      { status: err.message === "Unauthorized" ? 401 : 403 }
    );
  }

  const { id } = await params;

  // Проверка возможности удаления (внутри транзакции)
  const canModify = await canModifyUser(id);
  if (!canModify.allowed) {
    return NextResponse.json(
      { error: canModify.reason },
      { status: 400 }
    );
  }

  // Каскадное удаление в транзакции с повторной проверкой (защита от race condition)
  await prisma.$transaction(async (tx) => {
    // Повторная проверка в транзакции перед удалением
    const user = await tx.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      const adminCount = await tx.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        throw new Error("Cannot remove the last admin");
      }
    }

    // Каскадное удаление (items удалятся автоматически из-за onDelete: Cascade)
    await tx.user.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
