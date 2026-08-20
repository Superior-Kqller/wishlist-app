import { expect, test } from "@playwright/test";

test("wishlist switches between grid and table views", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("wishlist-card-v2").first()).toBeVisible();

  await page.getByRole("button", { name: "Показать таблицей" }).click();
  await expect(page.getByTestId("wishlist-product-row").first()).toBeVisible();

  await page.getByRole("button", { name: "Показать карточками" }).click();
  await expect(page.getByTestId("wishlist-card-v2").first()).toBeVisible();
});
