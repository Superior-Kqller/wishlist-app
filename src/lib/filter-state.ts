import type { UserWithStats } from "@/types";

export type UserScope = "all" | "me" | "user";

export function resolveUserScope(
  selectedUserId: string | null,
  currentUserId: string
): UserScope {
  if (selectedUserId === null) return "all";
  if (selectedUserId === "me" || selectedUserId === currentUserId) return "me";
  return "user";
}

/**
 * Нормализует userId из URL в один из поддерживаемых режимов.
 * Если userId невалидный (пользователь отсутствует), откатываемся к "all".
 */
export function normalizeSelectedUserId(
  selectedUserId: string | null,
  currentUserId: string | undefined,
  users: UserWithStats[]
): string | null {
  if (!selectedUserId) return null;
  if (!currentUserId) return selectedUserId;
  if (selectedUserId === "me" || selectedUserId === currentUserId) return "me";

  // Пока список пользователей не загружен, не делаем преждевременный fallback.
  if (users.length === 0) return selectedUserId;

  return users.some((u) => u.id === selectedUserId) ? selectedUserId : null;
}

