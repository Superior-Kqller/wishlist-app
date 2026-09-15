import type { ListWithMeta, UserWithStats } from "@/types";
import { resolveUserScope } from "@/lib/filter-state";

/**
 * Подборки, доступные в селекте при текущем выборе пользователя (как в переключателе контекста и в панели фильтров).
 */
export function filterListsBySelectedUser(
  lists: ListWithMeta[],
  users: UserWithStats[],
  currentUserId: string,
  selectedUserId: string | null,
): ListWithMeta[] {
  const userScope = resolveUserScope(selectedUserId, currentUserId);
  const owner =
    userScope === "me"
      ? currentUserId
      : userScope === "user" && users.some((u) => u.id === selectedUserId)
        ? selectedUserId
        : null;
  return owner ? lists.filter((l) => l.userId === owner) : lists;
}

/** Первая подборка текущего пользователя по названию (например, значение по умолчанию в форме создания). */
export function getFirstOwnedListId(lists: ListWithMeta[], currentUserId: string): string | null {
  const mine = lists
    .filter((l) => l.userId === currentUserId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return mine[0]?.id ?? null;
}
