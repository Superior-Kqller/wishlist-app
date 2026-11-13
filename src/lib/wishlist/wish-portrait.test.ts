import { describe, expect, it } from "vitest";
import { buildWishPortrait } from "./wish-portrait";

const TITLES = ["Кружка", "Кружки", "Наушники", "Плед из шерсти мериноса", "", "a", "🎁"];

describe("buildWishPortrait", () => {
  it("один и тот же рисунок для одного названия", () => {
    expect(buildWishPortrait("Кроссовки для бега")).toEqual(
      buildWishPortrait("Кроссовки для бега"),
    );
  });

  it("разные названия дают разные рисунки", () => {
    const drawings = new Set(TITLES.map((title) => JSON.stringify(buildWishPortrait(title))));
    expect(drawings.size).toBeGreaterThan(TITLES.length - 2);
  });

  it("рисунок не выходит за поле 100×100", () => {
    for (const title of TITLES) {
      const { rings, dot } = buildWishPortrait(title);
      expect(rings.length).toBeGreaterThanOrEqual(3);
      for (const ring of rings) {
        // Диагональ квадрата — худший случай при повороте.
        const reach = ring.size * Math.SQRT2;
        expect(ring.cx - reach).toBeGreaterThanOrEqual(0);
        expect(ring.cx + reach).toBeLessThanOrEqual(100);
        expect(ring.cy - reach).toBeGreaterThanOrEqual(0);
        expect(ring.cy + reach).toBeLessThanOrEqual(100);
      }
      expect(dot.x).toBeGreaterThan(0);
      expect(dot.x).toBeLessThan(100);
      expect(dot.y).toBeGreaterThan(0);
      expect(dot.y).toBeLessThan(100);
    }
  });
});
