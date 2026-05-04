import { expect, test, type Page } from "@playwright/test";

const E2E_USERNAME = "user1";
const E2E_PASSWORD = "changeme";

async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Логин").fill(E2E_USERNAME);
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL("**/");
}

test("wishlist switches between grid and table views", async ({ page }) => {
  await loginAsUser(page);

  await expect(page.getByTestId("wishlist-card-v2").first()).toBeVisible();

  await page.getByRole("button", { name: "Показать таблицей" }).click();
  await expect(page.getByTestId("wishlist-product-row").first()).toBeVisible();

  await page.getByRole("button", { name: "Показать карточками" }).click();
  await expect(page.getByTestId("wishlist-card-v2").first()).toBeVisible();
});
