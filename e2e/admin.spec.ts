import { test, expect } from "@playwright/test";

test.describe("Админ-панель", () => {
  test("GET /api/users без авторизации возвращает 401", async ({ request }) => {
    const response = await request.get("/api/users");
    expect(response.status()).toBe(401);
  });

  test("неавторизованный не попадает на /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
