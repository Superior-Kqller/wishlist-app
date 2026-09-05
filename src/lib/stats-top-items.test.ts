import { describe, expect, it } from "vitest";
import { pickDominantCurrency, selectTopItems } from "./stats-top-items";

const item = (price: number | null, currency: string, purchased = false) => ({
  price,
  currency,
  purchased,
});

describe("selectTopItems", () => {
  it("не выдаёт 100 USD за более дорогое, чем 500 RUB", () => {
    const top = selectTopItems([
      item(500, "RUB"),
      item(300, "RUB"),
      item(100, "USD"),
      item(90, "USD"),
    ]);

    expect(top.map((x) => x.price)).toEqual([500, 300]);
    expect(top.every((x) => x.currency === "RUB")).toBe(true);
  });

  it("берёт валюту, в которой желаний с ценой больше", () => {
    expect(pickDominantCurrency([item(1, "RUB"), item(1, "USD"), item(2, "USD")])).toBe("USD");
  });

  it("при равенстве выбирает первую по алфавиту — результат не зависит от порядка строк", () => {
    expect(pickDominantCurrency([item(1, "USD"), item(1, "EUR")])).toBe("EUR");
  });

  it("пропускает купленное и желания без цены", () => {
    expect(selectTopItems([item(null, "RUB"), item(700, "RUB", true)])).toEqual([]);
  });

  it("отдаёт не больше трёх строк", () => {
    expect(selectTopItems([1, 2, 3, 4, 5].map((n) => item(n * 10, "RUB")))).toHaveLength(3);
  });
});
