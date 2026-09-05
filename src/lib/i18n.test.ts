import { describe, expect, it } from "vitest";
import { getItemWord, getWishWord } from "@/lib/i18n";

/*
 * Правило выбора формы одно на язык и живёт в `pluralize`, поэтому
 * проверяется один раз — на желаниях.
 */
describe("правило числа", () => {
  it("declines the Russian noun by the last digits, not by the whole number", () => {
    expect(getWishWord("ru", 1)).toBe("желание");
    expect(getWishWord("ru", 3)).toBe("желания");
    expect(getWishWord("ru", 5)).toBe("желаний");
    expect(getWishWord("ru", 21)).toBe("желание");
    expect(getWishWord("ru", 22)).toBe("желания");
    expect(getWishWord("ru", 0)).toBe("желаний");
  });

  it("keeps the teens in the genitive plural", () => {
    expect(getWishWord("ru", 11)).toBe("желаний");
    expect(getWishWord("ru", 12)).toBe("желаний");
    expect(getWishWord("ru", 14)).toBe("желаний");
  });

  it("uses a plain English plural", () => {
    expect(getWishWord("en", 1)).toBe("wish");
    expect(getWishWord("en", 0)).toBe("wishes");
    expect(getWishWord("en", 21)).toBe("wishes");
  });
});

/*
 * А вот что теперь может разъехаться независимо — таблица форм у каждого
 * слова: правило общее, слова разные. Опечатка в одной из трёх строк не
 * видна ни типам, ни проверке правила выше.
 */
describe("формы слов", () => {
  it("ставит товар в три русские формы", () => {
    expect(getItemWord("ru", 1)).toBe("товар");
    expect(getItemWord("ru", 3)).toBe("товара");
    expect(getItemWord("ru", 5)).toBe("товаров");
    expect(getItemWord("ru", 11)).toBe("товаров");
  });

  it("ставит товар в две английские", () => {
    expect(getItemWord("en", 1)).toBe("item");
    expect(getItemWord("en", 4)).toBe("items");
  });
});
