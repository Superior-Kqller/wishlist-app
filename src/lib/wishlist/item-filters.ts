import type { Prisma } from "@prisma/client";

/*
 * Отбор каталога тоже принадлежит серверу: клиент видит одну страницу и не
 * может решать, что в неё не попало. Условия здесь — прямой перевод правил,
 * по которым карточку читает интерфейс (см. isItemPurchased).
 */

const MAX_CATEGORY_FILTERS = 30;

/** Купленное скрыто, пока его не попросили: факт покупки хранится в двух полях. */
export function buildPurchasedCondition(showPurchased: boolean): Prisma.ItemWhereInput | null {
  if (showPurchased) return null;
  return { AND: [{ purchased: false }, { status: { not: "PURCHASED" } }] };
}

export function parseCategoriesParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const unique = new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  return [...unique].slice(0, MAX_CATEGORY_FILTERS);
}

export function buildCategoryCondition(categories: string[]): Prisma.ItemWhereInput | null {
  if (categories.length === 0) return null;
  return { category: { in: categories } };
}
