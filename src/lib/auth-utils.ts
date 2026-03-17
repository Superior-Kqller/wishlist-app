import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import type { UserRole } from "@/types";

interface SessionUser {
  id: string;
  username: string;
  role?: UserRole;
}

/**
 * Получить текущего пользователя из сессии
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = session.user as SessionUser;
  return user;
}

/**
 * Получить ID текущего пользователя
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Проверить, является ли пользователь администратором
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/**
 * Проверить, является ли пользователь администратором (синхронная версия для клиента)
 */
export function isAdminClient(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}

/**
 * Получить пользователя с проверкой существования в БД
 * Используется для проверки актуальности сессии после изменений в БД
 */
export async function getCurrentUserWithDbCheck(): Promise<{
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
}

/**
 * Проверить права администратора и вернуть ошибку, если нет прав
 */
export async function requireAdmin(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUserWithDbCheck();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
