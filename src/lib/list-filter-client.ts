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

/** Первая подборка текущего пользователя по названию (например, значение по умолчанию в форме создания). */
export function getFirstOwnedListId(
  lists: ListWithMeta[],
  currentUserId: string,
): string | null {
  const mine = lists
    .filter((l) => l.userId === currentUserId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return mine[0]?.id ?? null;
}
