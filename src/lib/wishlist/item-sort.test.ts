import { describe, expect, it } from "vitest";
import {
  buildWishlistCursorCondition,
  DEFAULT_WISHLIST_SORT,
  encodeWishlistCursor,
  getWishlistOrderBy,
  InvalidWishlistCursorError,
  parseWishlistSort,
  WISHLIST_SORT_KEYS,
  type WishlistSortKey,
} from "./item-sort";

type Row = {
  id: string;
  createdAt: Date;
  priority: number;
  price: number | null;
  currency: string;
};

/*
 * Прогон страниц вместо разглядывания объекта where: пропуски и дубли видны
 * только на обходе, а условие курсора ради них и написано. Интерпретатор
 * понимает ровно те формы, которые собирает модуль.
 */
function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "AND") return (value as Record<string, unknown>[]).every((w) => matches(row, w));
    if (key === "OR") return (value as Record<string, unknown>[]).some((w) => matches(row, w));
    const actual = row[key as keyof Row];
    if (value === null) return actual === null;
    if (value instanceof Date) {
      return actual instanceof Date && actual.getTime() === value.getTime();
    }
    if (typeof value === "object" && value !== null) {
      const condition = value as { lt?: unknown; gt?: unknown; in?: unknown[] };
      if ("in" in condition) return (condition.in ?? []).includes(actual);
      const bound = condition.lt ?? condition.gt;
      const left = actual instanceof Date ? actual.getTime() : actual;
      const right = bound instanceof Date ? bound.getTime() : bound;
      if (left === null || right === null || right === undefined) return false;
      return "lt" in condition
        ? (left as number | string) < (right as number | string)
        : (left as number | string) > (right as number | string);
    }
    return actual === value;
  });
}

function comparator(sort: WishlistSortKey) {
  const rank = (row: Row) => row;
  return (a: Row, b: Row): number => {
    const left = rank(a);
    const right = rank(b);
    const byNull = (x: number | null, y: number | null) =>
      x === null && y === null ? 0 : x === null ? 1 : y === null ? -1 : null;
    switch (sort) {
      case "newest":
        return (
          right.createdAt.getTime() - left.createdAt.getTime() ||
          (left.id < right.id ? 1 : left.id > right.id ? -1 : 0)
        );
      case "oldest":
        return (
          left.createdAt.getTime() - right.createdAt.getTime() ||
          (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
        );
      case "priority-high":
      case "priority-low": {
        const byPriority =
          sort === "priority-high"
            ? right.priority - left.priority
            : left.priority - right.priority;
        return (
          byPriority ||
          right.createdAt.getTime() - left.createdAt.getTime() ||
          (left.id < right.id ? 1 : left.id > right.id ? -1 : 0)
        );
      }
      case "price-high":
      case "price-low": {
        if (left.currency !== right.currency) return left.currency < right.currency ? -1 : 1;
        const nulls = byNull(left.price, right.price);
        if (nulls !== null && nulls !== 0) return nulls;
        const byPrice =
          nulls === 0
            ? 0
            : sort === "price-high"
              ? (right.price ?? 0) - (left.price ?? 0)
              : (left.price ?? 0) - (right.price ?? 0);
        return byPrice || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0);
      }
    }
  };
}

function page(rows: Row[], sort: WishlistSortKey, cursor: string | null, take: number): Row[] {
  const filtered = cursor
    ? rows.filter((row) => matches(row, buildWishlistCursorCondition(sort, cursor)))
    : rows;
  return [...filtered].sort(comparator(sort)).slice(0, take);
}

function walk(rows: Row[], sort: WishlistSortKey, take: number): string[] {
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 50; guard += 1) {
    const chunk: Row[] = page(rows, sort, cursor, take);
    if (chunk.length === 0) break;
    seen.push(...chunk.map((row) => row.id));
    cursor = encodeWishlistCursor(sort, chunk[chunk.length - 1]);
  }
  return seen;
}

const CURRENCIES = ["RUB", "USD"];

// Совпадающие даты, цены и приоритеты — именно на них ломается курсор без ключа.
const rows: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: `id-${String(index).padStart(2, "0")}`,
  createdAt: new Date(2026, 0, 1 + (index % 5)),
  priority: (index % 3) + 1,
  price: index % 4 === 0 ? null : (index % 6) * 100,
  currency: CURRENCIES[index % 2],
}));

describe("parseWishlistSort", () => {
  it("принимает известные порядки и отвергает всё остальное", () => {
    expect(parseWishlistSort("price-low")).toBe("price-low");
    expect(parseWishlistSort("  oldest  ")).toBe("oldest");
    expect(parseWishlistSort("createdAt; drop table")).toBe(DEFAULT_WISHLIST_SORT);
    expect(parseWishlistSort(null)).toBe(DEFAULT_WISHLIST_SORT);
  });
});

describe("getWishlistOrderBy", () => {
  it("сортирует цену внутри валюты и уводит неизвестную цену в конец", () => {
    expect(getWishlistOrderBy("price-low")).toEqual([
      { currency: "asc" },
      { price: { sort: "asc", nulls: "last" } },
      { id: "desc" },
    ]);
  });
});

describe("постраничный обход", () => {
  it.each(WISHLIST_SORT_KEYS)("проходит весь каталог без пропусков и дублей: %s", (sort) => {
    const expected = [...rows].sort(comparator(sort)).map((row) => row.id);
    expect(walk(rows, sort, 7)).toEqual(expected);
  });

  it("не зависит от размера страницы", () => {
    expect(walk(rows, "price-high", 3)).toEqual(walk(rows, "price-high", 11));
  });
});

describe("buildWishlistCursorCondition", () => {
  it("после карточки без цены в этой валюте страниц больше нет", () => {
    const last: Row = {
      id: "id-99",
      createdAt: new Date(2026, 0, 1),
      priority: 1,
      price: null,
      currency: "USD",
    };
    const condition = buildWishlistCursorCondition(
      "price-low",
      encodeWishlistCursor("price-low", last),
    );
    const usd = rows.filter((row) => row.currency === "USD");
    expect(usd.filter((row) => matches(row, condition))).toEqual([]);
  });

  it("понимает старый курсор из одной даты", () => {
    const condition = buildWishlistCursorCondition("newest", "2026-01-03T00:00:00.000Z");
    expect(condition).toEqual({ createdAt: { lt: new Date("2026-01-03T00:00:00.000Z") } });
  });

  it("отвергает испорченный курсор", () => {
    expect(() => buildWishlistCursorCondition("newest", "не дата|id-1")).toThrow(
      InvalidWishlistCursorError,
    );
    expect(() => buildWishlistCursorCondition("price-low", "RUB|100")).toThrow(
      InvalidWishlistCursorError,
    );
  });
});
