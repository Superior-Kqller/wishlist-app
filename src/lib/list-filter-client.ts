import type { ListWithMeta, UserWithStats } from "@/types";
import { resolveUserScope } from "@/lib/filter-state";

/**
 * Подборки, доступные в селекте при текущем выборе пользователя (как на десктопе в CombinedFilter).
 */
export function filterListsBySelectedUser(
  lists: ListWithMeta[],
  users: UserWithStats[],
  currentUserId: string,
  selectedUserId: string | null
): ListWithMeta[] {
  const userScope = resolveUserScope(selectedUserId, currentUserId);
  const isAllMode = userScope === "all";
  const isMyMode = userScope === "me";
  const selectedOtherUser =
    !isAllMode && !isMyMode
      ? users.find((u) => u.id === selectedUserId)
      : undefined;
  const myLists = lists.filter((l) => l.userId === currentUserId);
  if (isAllMode) return lists;
  if (isMyMode) return myLists;
  if (selectedOtherUser) {
    return lists.filter((l) => l.userId === selectedOtherUser.id);
  }
  return lists;
}

/** Первая подборка текущего пользователя по названию (для URL по умолчанию). */
export function getFirstOwnedListId(
  lists: ListWithMeta[],
  currentUserId: string,
): string | null {
  const mine = lists
    .filter((l) => l.userId === currentUserId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return mine[0]?.id ?? null;
}

/**
 * Первая подборка в текущем scope фильтра пользователя (по названию).
 * Если подборок нет — null (в URL тогда используется «all»).
 */
export function getFirstListIdInScope(
  lists: ListWithMeta[],
  users: UserWithStats[],
  currentUserId: string,
  normalizedSelectedUserId: string | null,
): string | null {
  const scoped = filterListsBySelectedUser(
    lists,
    users,
    currentUserId,
    normalizedSelectedUserId,
  );
  if (scoped.length === 0) return null;
  return [...scoped].sort((a, b) => a.name.localeCompare(b.name, "ru"))[0]!.id;
}
