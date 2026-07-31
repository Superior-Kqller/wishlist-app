import { expect, test } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

test.describe.configure({ mode: "serial" });

const longSize = `Размер-${"оченьдлинноезначение".repeat(8)}`;
const longBudget = `До-${"1234567890".repeat(18)}-рублей`;
const longOccasion = `Повод-${"безпробелов".repeat(6)}`;
const longNotes = `Первая строка заметки\n${"непрерывнаядлиннаязаметка".repeat(20)}`;

const scenarios = [
  { name: "desktop classic", width: 1440, height: 900, theme: "classic" },
  { name: "desktop light", width: 1440, height: 900, theme: "light" },
  { name: "phone classic", width: 390, height: 844, theme: "classic" },
  { name: "phone light", width: 390, height: 844, theme: "light" },
] as const;

for (const scenario of scenarios) {
  test(`expanded preference profile wraps full values: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.addInitScript((theme) => {
      window.localStorage.setItem("wishlist-color-theme", theme);
    }, scenario.theme);

    await loginAsUser(page);
    const originalResponse = await page.request.get("/api/users/me");
    expect(originalResponse.ok()).toBeTruthy();
    const originalUser = (await originalResponse.json()) as { giftPreferences: unknown };

    const updateResponse = await page.request.patch("/api/users/me", {
      data: {
        giftPreferences: {
          favoriteCategories: ["Техника"],
          dislikedCategories: [],
          favoriteColors: [],
          dislikedColors: [],
          sizes: longSize,
          favoriteMaterials: [],
          dislikedMaterials: [],
          favoriteBrands: [],
          dislikedBrands: [],
          hobbies: [],
          doNotBuy: [],
          occasions: [longOccasion],
          budget: longBudget,
          notes: longNotes,
        },
      },
    });
    expect(updateResponse.ok()).toBeTruthy();

    try {
      await page.goto("/preferences");
      await expect(page.locator("html")).toHaveClass(new RegExp(`theme-${scenario.theme}`));

      const ownProfile = page
        .locator("article")
        .filter({ has: page.getByText("Это вы", { exact: true }) });
      await ownProfile.getByRole("button", { name: "Открыть профиль" }).click();

      for (const value of [longSize, longBudget, longOccasion]) {
        await expect(ownProfile.getByText(value, { exact: true })).toBeVisible();
      }
      await expect(ownProfile.getByText(longNotes, { exact: true })).toBeVisible();
      await expect(ownProfile.getByText("Бренды", { exact: true })).toHaveCount(0);

      const hasHorizontalOverflow = await ownProfile.evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);

      const viewportHasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(viewportHasHorizontalOverflow).toBe(false);
    } finally {
      const restoreResponse = await page.request.patch("/api/users/me", {
        data: { giftPreferences: originalUser.giftPreferences },
      });
      expect(restoreResponse.ok()).toBeTruthy();
    }
  });
}
