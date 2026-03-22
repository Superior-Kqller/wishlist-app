import { test, expect } from "@playwright/test";

test.describe("Элементы вишлиста (требуется авторизация)", () => {
  test("GET /api/items без авторизации возвращает 401", async ({ request }) => {
    const response = await request.get("/api/items");
    expect(response.status()).toBe(401);
  });

  test("POST /api/items без авторизации возвращает 401", async ({ request }) => {
    const response = await request.post("/api/items", {
      data: { title: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("DELETE /api/items/fake без авторизации возвращает 401", async ({ request }) => {
    const response = await request.delete("/api/items/fake-id");
    expect(response.status()).toBe(401);
  });
});
