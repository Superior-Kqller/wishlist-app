import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { passwordSchema } from "@/lib/password-validation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username может содержать только буквы, цифры и _"),
  password: passwordSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

// GET /api/users — список всех пользователей (только для админов)
export async function GET(req: NextRequest) {
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

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Максимум 100
  const cursor = searchParams.get("cursor") || undefined;

  const where = cursor ? { id: { lt: cursor } } : {};

  const users = await prisma.user.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
    take: limit + 1, // Берем на 1 больше для проверки hasMore
  });

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({
    users: items,
    pagination: {
      hasMore,
      nextCursor,
      limit,
    },
  });
}

// POST /api/users — создание нового пользователя (только для админов)
export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Используем create с обработкой UniqueConstraintError для защиты от race condition
    let user;
    try {
      user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          name: data.name,
          role: data.role,
        },
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
    } catch (createErr: any) {
      // Обработка race condition: если username уже существует
      if (createErr.code === "P2002" && createErr.meta?.target?.includes("username")) {
        return NextResponse.json(
          { error: "Такой логин уже занят" },
          { status: 409 }
        );
      }
      throw createErr;
    }

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Create user error", err);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
