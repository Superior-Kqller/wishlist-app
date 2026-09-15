import { expect, test } from "@playwright/test";

/* Выбор «чей список» и подборки — одно меню, а не вкладки «Все / Мои». */

test("на десктопе нет вкладок «Все / Мои», есть общее меню", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("tab", { name: "Все" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Мои" })).toHaveCount(0);

  const trigger = page.getByTestId("wishlist-scope-trigger");
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("Все пользователи");

  await trigger.click();
  await expect(page.getByTestId("combined-user-option-all")).toBeVisible();
  await expect(page.getByTestId("combined-user-option-me")).toBeVisible();
});

test("смена пользователя сбрасывает подборку", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await page.getByTestId("wishlist-scope-trigger").click();
  await page.getByTestId("combined-user-option-me").click();

  await expect(page).toHaveURL(/(?:\?|&)userId=me(?:&|$)/);
  await expect(page).not.toHaveURL(/(?:\?|&)listId=/);
});
