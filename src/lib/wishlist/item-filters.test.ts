import { describe, expect, it } from "vitest";
import {
  buildCategoryCondition,
  buildPurchasedCondition,
  parseCategoriesParam,
} from "./item-filters";

describe("buildPurchasedCondition", () => {
  it("скрывает купленное по обоим полям, где хранится покупка", () => {
    expect(buildPurchasedCondition(false)).toEqual({
      AND: [{ purchased: false }, { status: { not: "PURCHASED" } }],
    });
  });

  it("не ограничивает выдачу, когда купленное просят показать", () => {
    expect(buildPurchasedCondition(true)).toBeNull();
  });
});

describe("parseCategoriesParam", () => {
  it("разбирает список, убирая пустые значения и повторы", () => {
    expect(parseCategoriesParam("books, , books,electronics")).toEqual(["books", "electronics"]);
  });

  it("пустой параметр не превращается в фильтр", () => {
    expect(parseCategoriesParam(null)).toEqual([]);
    expect(buildCategoryCondition([])).toBeNull();
  });

  it("ограничивает длину списка, чтобы ссылка не задавала произвольно большой запрос", () => {
    const many = Array.from({ length: 100 }, (_, index) => `c${index}`).join(",");
    expect(parseCategoriesParam(many)).toHaveLength(30);
  });
});
