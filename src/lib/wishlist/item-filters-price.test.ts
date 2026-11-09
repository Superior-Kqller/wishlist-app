import { describe, expect, it } from "vitest";
import { buildPriceCondition } from "./item-filters";

describe("buildPriceCondition", () => {
  it("без границ условия нет", () => {
    expect(buildPriceCondition(null, null)).toBeNull();
  });

  it("одна граница — одно сравнение, обе — диапазон включительно", () => {
    expect(buildPriceCondition(100, null)).toEqual({ price: { gte: 100 } });
    expect(buildPriceCondition(null, 500)).toEqual({ price: { lte: 500 } });
    expect(buildPriceCondition(0, 500)).toEqual({ price: { gte: 0, lte: 500 } });
  });
});
