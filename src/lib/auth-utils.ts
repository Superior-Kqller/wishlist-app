import "server-only";
import { cache } from "react";
import { getCachedServerSession } from "./auth";
import { prisma } from "./prisma";
import { ApiAccessError } from "./api-responses";
import type { UserRole } from "@/types";

interface SessionUser {
  id: string;
  username: string;
  role?: UserRole;
}

/**
 * Получить текущего пользователя из сессии
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getCachedServerSession();
  if (!session?.user) return null;

  const user = session.user as SessionUser;
  return user;
});

/**
 * Получить ID текущего пользователя
 */
export const getCurrentUserId = cache(async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
});

/**
 * ID из сессии только если запись пользователя есть в БД
 * (устраняет «битую» сессию после сброса БД / рассинхрон).
 */
export const getSessionUserIdVerified = cache(async function getSessionUserIdVerified(): Promise<
  string | null
> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return row?.id ?? null;
});

/**
 * Получить пользователя с проверкой существования в БД
 * Используется для проверки актуальности сессии после изменений в БД
 */
export const getCurrentUserWithDbCheck = cache(async function getCurrentUserWithDbCheck(): Promise<{
  id: string;
  role: UserRole;
} | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  return user;
});

/**
 * Проверить права администратора и вернуть ошибку, если нет прав
 */
export async function requireAdmin(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUserWithDbCheck();
  if (!user) throw new ApiAccessError(401, "Необходима авторизация");
  if (user.role !== "ADMIN") throw new ApiAccessError(403, "Недостаточно прав");
  return user;
}
