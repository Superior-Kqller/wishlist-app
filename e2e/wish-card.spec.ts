import { expect, test } from "@playwright/test";

/*
 * Карточка желания в текущей разметке: действия спрятаны в меню «Действия с
 * карточкой», ссылка на товар — единственная кнопка-иконка, а «Уже куплено»
 * стоит отдельной меткой под заголовком.
 */

test("у карточки одна ссылка на товар и меню действий", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByTestId("wishlist-card-v2-title")).toBeVisible();
  await expect(firstCard.getByTestId("wishlist-card-v2-footer")).toBeVisible();

  // Ссылка на товар — не более одной, и только как кнопка-иконка с подписью.
  expect(
    await firstCard.getByRole("link", { name: "Открыть ссылку на товар в новой вкладке" }).count(),
  ).toBeLessThanOrEqual(1);
  expect(await firstCard.getByRole("link").count()).toBeLessThanOrEqual(1);
  await expect(firstCard.getByTestId("wishlist-card-actions")).toHaveCount(1);
});

test("меню действий: купить, редактировать, удалить", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  await firstCard.getByTestId("wishlist-card-actions").click();
  const menu = page.getByRole("menu");
  await expect(
    menu.getByRole("menuitem", { name: /Отметить купленным|Вернуть в доступные/ }),
  ).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Редактировать" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Удалить" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("купленное желание помечено на узком экране", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const uniqueTitle = `mobile purchased ${Date.now()}`;
  const importResponse = await page.request.post("/api/items/import", {
    data: { items: [{ title: uniqueTitle, price: 12990, purchased: true }] },
  });
  expect(importResponse.ok()).toBeTruthy();

  await page.goto(`/?search=${encodeURIComponent(uniqueTitle)}&purchased=show`);

  const card = page.getByTestId("wishlist-card-v2").filter({ hasText: uniqueTitle }).first();
  await expect(card).toBeVisible();
  await expect(card.getByTestId("wishlist-card-v2-purchased-label")).toBeVisible();
});
