import { test, expect } from "@playwright/test";

test.describe("Админ-панель", () => {
  // Проверки про отсутствие доступа: общее состояние входа здесь мешает.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("GET /api/users без авторизации возвращает 401", async ({ request }) => {
    const response = await request.get("/api/users");
    expect(response.status()).toBe(401);
  });

  test("неавторизованный не попадает на /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});
