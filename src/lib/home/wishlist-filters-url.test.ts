import { describe, expect, it } from "vitest";
import { parseWishlistFilters, serializeWishlistFilters } from "./wishlist-filters-url";

const parse = (query: string) => parseWishlistFilters(new URLSearchParams(query));

describe("parseWishlistFilters", () => {
  it("читает все фильтры из ссылки", () => {
    expect(
      parse(
        "userId=me&listId=l1&search=книга&sort=price-low&view=table&purchased=show&categories=books,toys",
      ),
    ).toEqual({
      userId: "me",
      listId: "l1",
      search: "книга",
      sort: "price-low",
      view: "table",
      showPurchased: true,
      categories: ["books", "toys"],
    });
  });

  it("пустая ссылка даёт значения по умолчанию", () => {
    expect(parse("")).toEqual({
      userId: null,
      listId: null,
      search: "",
      sort: "newest",
      view: null,
      showPurchased: false,
      categories: [],
    });
  });

  it("устаревшее listId=all значит «все подборки»", () => {
    expect(parse("listId=all").listId).toBeNull();
  });

  it("явный выбор карточек сохраняется, неизвестный вид — нет", () => {
    expect(parse("view=grid").view).toBe("grid");
    expect(parse("view=cards").view).toBeNull();
  });

  it("неизвестная сортировка не проходит дальше ссылки", () => {
    expect(parse("sort=цена").sort).toBe("newest");
  });
});

describe("serializeWishlistFilters", () => {
  it("не пишет в адрес значения по умолчанию", () => {
    expect(serializeWishlistFilters(parse(""))).toBe("");
  });

  it("пишет в адрес и явно выбранные карточки", () => {
    expect(serializeWishlistFilters({ ...parse(""), view: "grid" })).toBe("view=grid");
  });

  it("возвращает ссылку к тем же фильтрам", () => {
    const query =
      "userId=me&listId=l1&search=книга&sort=price-low&view=table&purchased=show&categories=books,toys";
    expect(parse(serializeWishlistFilters(parse(query)))).toEqual(parse(query));
  });
});
