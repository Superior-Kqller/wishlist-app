import "server-only";
import { cache } from "react";
import { getCachedServerSession } from "./auth";
import { prisma } from "./prisma";
import { ApiAccessError } from "./api-responses";
import type { UserRole } from "@/types";

/**
 * Пользователь сессии, если его запись есть в БД (устраняет «битую» сессию
 * после сброса БД / рассинхрон). Один запрос на весь рендер благодаря `cache`.
 */
export const getCurrentUserWithDbCheck = cache(async function getCurrentUserWithDbCheck(): Promise<{
  id: string;
  role: UserRole;
} | null> {
  const session = await getCachedServerSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
});

export async function getSessionUserIdVerified(): Promise<string | null> {
  return (await getCurrentUserWithDbCheck())?.id ?? null;
}

/**
 * Проверить права администратора и вернуть ошибку, если нет прав
 */
export async function requireAdmin(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUserWithDbCheck();
  if (!user) throw new ApiAccessError(401, "Необходима авторизация");
  if (user.role !== "ADMIN") throw new ApiAccessError(403, "Недостаточно прав");
  return user;
}
