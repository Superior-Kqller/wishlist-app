import { describe, it, expect } from "vitest";
import { formatPrice, priorityColor, priorityBorderClass, getTagColor } from "./utils";

describe("formatPrice", () => {
  it("форматирует рубли", () => {
    expect(formatPrice(1500, "RUB")).toContain("₽");
    expect(formatPrice(1500, "RUB")).toContain("1");
  });

  it("форматирует доллары", () => {
    expect(formatPrice(99, "USD")).toContain("$");
  });

  it("форматирует евро", () => {
    expect(formatPrice(100, "EUR")).toContain("€");
  });

  it("использует код валюты для неизвестных", () => {
    expect(formatPrice(100, "GBP")).toContain("GBP");
  });

  it("по умолчанию RUB", () => {
    expect(formatPrice(100)).toContain("₽");
  });
});

describe("priorityColor", () => {
  it("возвращает цвет для каждого приоритета 1-5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(priorityColor(i)).toContain("text-");
    }
  });

  it("возвращает дефолт для неизвестного приоритета", () => {
    expect(priorityColor(0)).toBe(priorityColor(3));
    expect(priorityColor(99)).toBe(priorityColor(3));
  });
});

describe("priorityBorderClass", () => {
  it("содержит border-l-4", () => {
    expect(priorityBorderClass(1)).toContain("border-l-4");
  });
});

describe("getTagColor", () => {
  it("возвращает одинаковый цвет для одного тега", () => {
    expect(getTagColor("test")).toBe(getTagColor("test"));
  });

  it("возвращает разные цвета для разных тегов (в большинстве случаев)", () => {
    const colors = new Set(["alpha", "beta", "gamma", "delta", "epsilon"].map(getTagColor));
    expect(colors.size).toBeGreaterThan(1);
  });

  it("возвращает цвет из палитры (hex формат)", () => {
    expect(getTagColor("anything")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
