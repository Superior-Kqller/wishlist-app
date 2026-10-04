import { describe, expect, it } from "vitest";
import { buildAddItemPath, findSharedLink, safeCallbackPath } from "./deep-links";

describe("findSharedLink", () => {
  it("находит ссылку в тексте, когда поле url пустое", () => {
    expect(findSharedLink(null, "Наушники — https://www.ozon.ru/product/123/?sh=1 за 5000")).toBe(
      "https://www.ozon.ru/product/123/?sh=1",
    );
  });

  it("берёт поле url раньше текста и не находит ничего без ссылки", () => {
    expect(findSharedLink("https://a.ru/x", "https://b.ru/y")).toBe("https://a.ru/x");
    expect(findSharedLink(null, "просто текст")).toBeNull();
  });
});

describe("buildAddItemPath", () => {
  it("кодирует ссылку целиком, чтобы её параметры не смешались с нашими", () => {
    const path = buildAddItemPath("https://shop.ru/p?id=1&q=100%25");
    expect(new URLSearchParams(path.slice(2)).get("addUrl")).toBe(
      "https://shop.ru/p?id=1&q=100%25",
    );
  });
});

describe("safeCallbackPath", () => {
  it("оставляет путь с параметрами своего сайта", () => {
    expect(safeCallbackPath("/?addUrl=https%3A%2F%2Fa.ru&fill=1")).toBe(
      "/?addUrl=https%3A%2F%2Fa.ru&fill=1",
    );
    expect(safeCallbackPath("http://internal:3000/calendar?m=5")).toBe("/calendar?m=5");
  });

  it("не уводит на чужой домен", () => {
    expect(safeCallbackPath("//evil.com/x")).toBe("/x");
    expect(safeCallbackPath("https://evil.com//evil.com")).toBe("/");
    expect(safeCallbackPath("/\\evil.com")).toBe("/");
    expect(safeCallbackPath(null)).toBe("/");
  });
});
