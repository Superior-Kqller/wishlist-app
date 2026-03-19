import type { ListWithMeta, UserWithStats } from "@/types";

/**
 * Подборки, доступные в селекте при текущем выборе пользователя (как на десктопе в CombinedFilter).
 */
export function filterListsBySelectedUser(
  lists: ListWithMeta[],
  users: UserWithStats[],
  currentUserId: string,
  selectedUserId: string | null
): ListWithMeta[] {
  const isAllMode = selectedUserId === null;
  const isMyMode =
    selectedUserId === "me" || selectedUserId === currentUserId;
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
  return [];
}
