import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithDbCheck, getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { passwordSchema } from "@/lib/password-validation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  password: passwordSchema,
  currentPassword: z.string().min(1).optional(),
});

// PATCH /api/users/[id]/password — изменение пароля
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const dbUser = await getCurrentUserWithDbCheck();
  const userIsAdmin = dbUser?.role === "ADMIN";
  const isOwnAccount = currentUserId === id;

  if (!userIsAdmin && !isOwnAccount) {
    return NextResponse.json(
      { error: "Можно менять только свой пароль" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    const requiresCurrentPassword = isOwnAccount;
    if (requiresCurrentPassword && !data.currentPassword) {
      return NextResponse.json(
        { error: "Для смены пароля укажите текущий пароль" },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (requiresCurrentPassword) {
      const isCurrentPasswordValid =
        typeof user.password === "string" &&
        (await bcrypt.compare(data.currentPassword!, user.password));

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Текущий пароль указан неверно" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Невалидный JSON в теле запроса" },
        { status: 400 }
      );
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ошибка проверки данных", details: err.issues },
        { status: 400 }
      );
    }
    sanitizeError("Change password error", err, { userId: id });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
