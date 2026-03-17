import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { passwordSchema } from "@/lib/password-validation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  password: passwordSchema,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Проверка: пользователь может менять только свой пароль, админ - любой
  const userIsAdmin = await isAdmin();
  const isOwnAccount = currentUserId === id;

  if (!userIsAdmin && !isOwnAccount) {
    return NextResponse.json(
      { error: "Forbidden: You can only change your own password" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    // Проверка существования пользователя
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
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
