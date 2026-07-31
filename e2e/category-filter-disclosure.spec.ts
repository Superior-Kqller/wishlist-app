import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

const scenarios = [
  { name: "desktop classic", width: 1440, height: 900, theme: "classic", desktop: true },
  { name: "desktop light", width: 1440, height: 900, theme: "light", desktop: true },
  { name: "phone classic", width: 390, height: 844, theme: "classic", desktop: false },
  { name: "phone light", width: 390, height: 844, theme: "light", desktop: false },
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
  test(`category filter disclosure: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.addInitScript((theme) => {
      window.localStorage.setItem("wishlist-color-theme", theme);
    }, scenario.theme);

    await loginAsUser(page);
    await expect(page.locator("html")).toHaveClass(new RegExp(`theme-${scenario.theme}`));

    const suffix = `${scenario.name}-${Date.now()}`;
    const electronicsTitle = `E2E техника ${suffix}`;
    const booksTitle = `E2E книги ${suffix}`;
    const createdIds = [
      await createCategoryItem(page, electronicsTitle, "electronics"),
      await createCategoryItem(page, booksTitle, "books"),
    ];

    try {
      await page.reload();
      await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
      await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

      if (scenario.desktop) {
        const trigger = page.getByRole("button", { name: /^Категории/ });
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(
          page.getByRole("button", { name: "Добавить категорию: Техника" }),
        ).toBeHidden();

        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(trigger).toHaveAttribute("aria-expanded", "true");

        await page.getByRole("button", { name: "Добавить категорию: Техника" }).click();
        await expect(trigger).toHaveAccessibleName(/Категории.*1/);
        await expect(
          page.getByRole("button", { name: "Убрать категорию: Техника" }).first(),
        ).toBeVisible();
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
        await expect(page.getByText(booksTitle, { exact: true })).toBeHidden();

        await page.getByRole("button", { name: "Добавить категорию: Книги" }).click();
        await expect(trigger).toHaveAccessibleName(/Категории.*2/);
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

        await page.getByRole("button", { name: "Убрать категорию: Техника" }).first().click();
        await expect(trigger).toHaveAccessibleName(/Категории.*1/);
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeHidden();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

        await page.getByRole("button", { name: "Очистить категории" }).click();
        await expect(trigger).toHaveAccessibleName(/^Категории$/);
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();
      } else {
        await expect(page.getByRole("button", { name: /^Категории/ })).toHaveCount(0);
        const mobileFilters = page.getByRole("button", { name: /^Фильтры/ });
        await mobileFilters.click();

        const drawer = page.getByRole("dialog", { name: "Фильтры" });
        await expect(drawer).toBeVisible();
        await drawer.getByRole("button", { name: "Добавить категорию: Техника" }).click();
        await drawer.getByRole("button", { name: "Добавить категорию: Книги" }).click();
        await drawer.getByRole("button", { name: "Готово" }).click();

        await expect(mobileFilters).toHaveAccessibleName("Фильтры: 2");
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

        await mobileFilters.click();
        await drawer.getByRole("button", { name: "Убрать категорию: Техника" }).click();
        await drawer.getByRole("button", { name: "Готово" }).click();
        await expect(mobileFilters).toHaveAccessibleName("Фильтры: 1");
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeHidden();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();

        await mobileFilters.click();
        await drawer.getByRole("button", { name: "Сбросить выбранные категории" }).click();
        await drawer.getByRole("button", { name: "Готово" }).click();
        await expect(mobileFilters).toHaveAccessibleName("Фильтры");
        await expect(page.getByText(electronicsTitle, { exact: true })).toBeVisible();
        await expect(page.getByText(booksTitle, { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: /^Категории/ })).toHaveCount(0);
      }
    } finally {
      await Promise.all(createdIds.map((id) => page.request.delete(`/api/items/${id}`)));
    }
  });
}
