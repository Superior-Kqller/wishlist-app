import { describe, expect, it } from "vitest";
import { getProductCategoryLabel } from "@/lib/categories";

describe("getProductCategoryLabel", () => {
  it("переводит известный идентификатор на язык интерфейса", () => {
    expect(getProductCategoryLabel("electronics", "ru")).toBe("Техника");
    expect(getProductCategoryLabel("electronics", "en")).toBe("Electronics");
  });

  /*
   * `POST /api/items` принимает в поле категории любую строку до 80 символов,
   * а импорт с другого экземпляра приносит значения, которых нет в местном
   * справочнике. Раньше такой товар подписывался «Без категории» — интерфейс
   * утверждал обратное тому, что лежит в базе.
   */
  it("показывает незнакомую категорию как есть", () => {
    expect(getProductCategoryLabel("Винтажные пластинки", "ru")).toBe("Винтажные пластинки");
    expect(getProductCategoryLabel("Vinyl records", "en")).toBe("Vinyl records");
  });

  it("обрезает пробелы вокруг незнакомого значения", () => {
    expect(getProductCategoryLabel("  Сад  ", "ru")).toBe("Сад");
  });

  it("говорит «Без категории» только когда её действительно нет", () => {
    expect(getProductCategoryLabel(null, "ru")).toBe("Без категории");
    expect(getProductCategoryLabel(undefined, "en")).toBe("No category");
    expect(getProductCategoryLabel("   ", "ru")).toBe("Без категории");
  });
});
