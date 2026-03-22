import { test, expect } from "@playwright/test";

test.describe("Аутентификация", () => {
  test("перенаправляет неавторизованного на /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("страница логина содержит форму", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="username"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("показывает ошибку при неверных данных", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="username"], input[type="text"]').first().fill("wrong");
    await page.locator('input[type="password"]').first().fill("wrong");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=Неверн").or(page.locator('[role="alert"]'))).toBeVisible({
      timeout: 10000,
    });
  });
});
