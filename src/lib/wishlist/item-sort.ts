import type { Prisma } from "@prisma/client";

/*
 * Порядок каталога живёт на сервере.
 *
 * Клиент получает страницами по 30 карточек, поэтому сортировать и отбирать
 * их после выдачи нельзя: самое дешёвое желание может лежать на третьей
 * странице и никогда не попасть наверх. Здесь описано, из каких колонок
 * состоит каждый порядок, — из одного описания собираются и orderBy, и
 * курсор, и условие «строго после курсора». Разъехаться им негде.
 */

export const WISHLIST_SORT_KEYS = [
  "newest",
  "oldest",
  "priority-high",
  "priority-low",
  "price-high",
  "price-low",
] as const;

export type WishlistSortKey = (typeof WISHLIST_SORT_KEYS)[number];

export const DEFAULT_WISHLIST_SORT: WishlistSortKey = "newest";

type SortField = "createdAt" | "id" | "priority" | "price" | "currency";

type SortColumn = {
  field: SortField;
  direction: "asc" | "desc";
};

/*
 * Цена сравнивается только внутри своей валюты: 100 USD и 500 RUB несравнимы
 * без курса, а курса у приложения нет. Поэтому валюта — первая колонка
 * ценовых порядков, а желания без цены уходят в конец своей группы.
 */
const SORT_COLUMNS: Record<WishlistSortKey, SortColumn[]> = {
  newest: [
    { field: "createdAt", direction: "desc" },
    { field: "id", direction: "desc" },
  ],
  oldest: [
    { field: "createdAt", direction: "asc" },
    { field: "id", direction: "asc" },
  ],
  "priority-high": [
    { field: "priority", direction: "desc" },
    { field: "createdAt", direction: "desc" },
    { field: "id", direction: "desc" },
  ],
  "priority-low": [
    { field: "priority", direction: "asc" },
    { field: "createdAt", direction: "desc" },
    { field: "id", direction: "desc" },
  ],
  "price-high": [
    { field: "currency", direction: "asc" },
    { field: "price", direction: "desc" },
    { field: "id", direction: "desc" },
  ],
  "price-low": [
    { field: "currency", direction: "asc" },
    { field: "price", direction: "asc" },
    { field: "id", direction: "desc" },
  ],
};

/** Единственная колонка, которая бывает пустой; пустое значение всегда идёт последним. */
const NULLABLE_FIELD: SortField = "price";

function isNullable(field: SortField): boolean {
  return field === NULLABLE_FIELD;
}

export function parseWishlistSort(raw: string | null | undefined): WishlistSortKey {
  const value = raw?.trim();
  return (WISHLIST_SORT_KEYS as readonly string[]).includes(value ?? "")
    ? (value as WishlistSortKey)
    : DEFAULT_WISHLIST_SORT;
}

export function getWishlistOrderBy(sort: WishlistSortKey): Prisma.ItemOrderByWithRelationInput[] {
  return SORT_COLUMNS[sort].map(({ field, direction }) =>
    isNullable(field)
      ? ({ [field]: { sort: direction, nulls: "last" } } as Prisma.ItemOrderByWithRelationInput)
      : ({ [field]: direction } as Prisma.ItemOrderByWithRelationInput),
  );
}

type CursorSource = {
  id: string;
  createdAt: Date;
  priority: number;
  price: number | null;
  currency: string;
};

function encodeValue(field: SortField, item: CursorSource): string {
  switch (field) {
    case "createdAt":
      return item.createdAt.toISOString();
    case "id":
      return item.id;
    case "priority":
      return String(item.priority);
    case "price":
      return item.price === null ? "" : String(item.price);
    case "currency":
      return item.currency;
  }
}

/** Курсор — значения колонок текущего порядка у последней отданной карточки. */
export function encodeWishlistCursor(sort: WishlistSortKey, item: CursorSource): string {
  return SORT_COLUMNS[sort]
    .map((column) => encodeURIComponent(encodeValue(column.field, item)))
    .join("|");
}

type ParsedValue = Date | number | string | null;

function parseValue(field: SortField, raw: string): ParsedValue | undefined {
  if (isNullable(field) && raw === "") return null;
  switch (field) {
    case "createdAt": {
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
    case "priority":
    case "price": {
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
    case "id":
    case "currency":
      return raw === "" ? undefined : raw;
  }
}

function equalCondition(field: SortField, value: ParsedValue): Prisma.ItemWhereInput {
  return { [field]: value } as Prisma.ItemWhereInput;
}

/**
 * «Строго после курсора» по одной колонке. Пустая цена стоит последней, поэтому
 * после неё ничего нет (undefined), а любое известное значение обгоняют в том
 * числе карточки без цены.
 */
function afterCondition(column: SortColumn, value: ParsedValue): Prisma.ItemWhereInput | undefined {
  if (value === null) return undefined;
  const comparison = column.direction === "desc" ? { lt: value } : { gt: value };
  const strictly = { [column.field]: comparison } as Prisma.ItemWhereInput;
  if (!isNullable(column.field)) return strictly;
  return { OR: [strictly, { [column.field]: null } as Prisma.ItemWhereInput] };
}

export class InvalidWishlistCursorError extends Error {}

/**
 * Условие «страница после курсора» — лексикографическое сравнение кортежа
 * колонок: равенство по предыдущим и строгий обгон по текущей.
 */
export function buildWishlistCursorCondition(
  sort: WishlistSortKey,
  cursor: string,
): Prisma.ItemWhereInput {
  const columns = SORT_COLUMNS[sort];
  const parts = cursor.split("|").map((part) => decodeURIComponent(part));

  // Старые ссылки хранят курсор из одной даты — они относятся к порядку по умолчанию.
  if (parts.length === 1 && sort === DEFAULT_WISHLIST_SORT) {
    const date = new Date(parts[0]);
    if (Number.isNaN(date.getTime())) throw new InvalidWishlistCursorError();
    return { createdAt: { lt: date } };
  }

  if (parts.length !== columns.length) throw new InvalidWishlistCursorError();

  const values = columns.map((column, index) => {
    const value = parseValue(column.field, parts[index]);
    if (value === undefined) throw new InvalidWishlistCursorError();
    return value;
  });

  const branches: Prisma.ItemWhereInput[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const after = afterCondition(columns[index], values[index]);
    if (!after) continue;
    const equals = columns
      .slice(0, index)
      .map((column, position) => equalCondition(column.field, values[position]));
    branches.push(equals.length > 0 ? { AND: [...equals, after] } : after);
  }

  // Курсор на последней возможной позиции: дальше страниц нет.
  if (branches.length === 0) return { id: { in: [] } };
  return { OR: branches };
}
