import { expect, test } from "@playwright/test";

/*
 * «Чей список» — ряд лиц на любой ширине; меню над списком выбирает только
 * подборку. На десктопе люди раньше прятались в обрезанный триггер меню.
 */

test("на десктопе люди — чипы, а меню выбирает подборку", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await expect(page.getByTestId("people-chip-all")).toBeVisible();
  await expect(page.getByTestId("people-chip-me")).toBeVisible();

  const trigger = page.getByTestId("wishlist-scope-trigger");
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText("Все подборки");

  await trigger.click();
  await expect(page.getByTestId("combined-user-option-me")).toHaveCount(0);
});

test("смена пользователя сбрасывает подборку", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");

  await page.getByTestId("people-chip-me").click();

  await expect(page).toHaveURL(/(?:\?|&)userId=me(?:&|$)/);
  await expect(page).not.toHaveURL(/(?:\?|&)listId=/);
});
