import { expect, test, type Page } from "@playwright/test";

/*
 * Категории выбираются в панели «Фильтры» на любой ширине экрана; выбранные
 * фильтры считаются в подписи кнопки и снимаются чипами над списком.
 */

const scenarios = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
] as const;

async function createCategoryItem(page: Page, title: string, category: string) {
  const response = await page.request.post("/api/items", {
    data: { title, category },
  });
  expect(response.ok()).toBeTruthy();
  const item = (await response.json()) as { id: string };
  return item.id;
}

for (const scenario of scenarios) {
  test(`category filter: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.goto("/");

    const suffix = `${scenario.name}-${Date.now()}`;
    const electronicsTitle = `E2E техника ${suffix}`;
    const booksTitle = `E2E книги ${suffix}`;
    const createdIds = [
      await createCategoryItem(page, electronicsTitle, "electronics"),
      await createCategoryItem(page, booksTitle, "books"),
    ];

    try {
      await page.goto(`/?search=${encodeURIComponent(`E2E`)}`);
      await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
      await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

      const filters = page.getByRole("button", { name: /^Фильтры/ }).first();
      const drawer = page.getByRole("dialog", { name: "Фильтры" });

      await filters.click();
      await expect(drawer).toBeVisible();
      await drawer.getByTestId("mobile-category-electronics").click();
      await expect(drawer.getByTestId("mobile-category-electronics")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await drawer.getByRole("button", { name: /^Показать/ }).click();
      await expect(drawer).toBeHidden();

      await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
      await expect(page.getByText(booksTitle, { exact: true })).toBeHidden();
      await expect(page).toHaveURL(/categories=electronics/);

      // На широком экране фильтр снимается чипом над списком; на узком чипов
      // нет — категория выключается там же, где включалась.
      if (scenario.width >= 1024) {
        await page.getByRole("button", { name: "Снять фильтр: Категория: Техника" }).click();
      } else {
        await filters.click();
        await drawer.getByTestId("mobile-category-electronics").click();
        await drawer.getByRole("button", { name: /^Показать/ }).click();
      }
      await expect(page).not.toHaveURL(/categories=/);
      await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
      await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();
    } finally {
      await Promise.all(createdIds.map((id) => page.request.delete(`/api/items/${id}`)));
    }
  });
}
