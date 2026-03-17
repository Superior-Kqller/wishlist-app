import { prisma } from "./prisma";

/**
 * Проверяет, может ли пользователь видеть подборку (владелец или в ListViewer).
 */
export async function canUserSeeList(
  listId: string,
  userId: string
): Promise<boolean> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { userId: true, viewers: { select: { userId: true } } },
  });
  if (!list) return false;
  if (list.userId === userId) return true;
  return list.viewers.some((v) => v.userId === userId);
}

/**
 * Возвращает ID подборок, которые пользователь может видеть (владелец или в ListViewer).
 */
export async function getVisibleListIdsForUser(userId: string): Promise<string[]> {
  const lists = await prisma.list.findMany({
    where: {
      OR: [{ userId }, { viewers: { some: { userId } } }],
    },
    select: { id: true },
  });
  return lists.map((l) => l.id);
}

/**
 * Проверяет, может ли пользователь видеть товар.
 * Товар без подборки (listId == null) скрыт от всех до привязки к подборке.
 */
export async function canUserSeeItem(
  itemId: string,
  userId: string
): Promise<boolean> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { listId: true },
  });
  if (!item) return false;
  if (!item.listId) return false;
  return canUserSeeList(item.listId, userId);
}
