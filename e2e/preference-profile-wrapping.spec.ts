import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const longSize = `Размер-${"оченьдлинноезначение".repeat(8)}`;
const longBudget = `До-${"1234567890".repeat(18)}-рублей`;
const longOccasion = `Повод-${"безпробелов".repeat(6)}`;
const longNotes = `Первая строка заметки\n${"непрерывнаядлиннаязаметка".repeat(20)}`;
const longName = "Александринапетровнаконстантинопольская-Зауральская";

const scenarios = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
] as const;

for (const scenario of scenarios) {
  test(`expanded preference profile wraps full values: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.goto("/");
    const originalResponse = await page.request.get("/api/users/me");
    expect(originalResponse.ok()).toBeTruthy();
    const originalUser = (await originalResponse.json()) as {
      giftPreferences: unknown;
      name: string;
    };

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
      const me = (await (await page.request.get("/api/users/me")).json()) as { id: string };
      await page.goto(`/preferences?userId=${me.id}`);

      // Профиль читается в сцене выбранного человека, а не в раскрытой карточке.
      const stage = page.locator(`section[aria-labelledby="profile-stage-${me.id}"]`);
      await expect(stage).toBeVisible();

      for (const value of [longSize, longBudget, longOccasion]) {
        await expect(stage.getByText(value, { exact: true })).toBeVisible();
      }
      await expect(stage.getByText(longNotes, { exact: true })).toBeVisible();
      await expect(stage.getByText("Бренды", { exact: true })).toHaveCount(0);

      const hasHorizontalOverflow = await stage.evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);

      // Длинное имя без пробелов не должно растягивать ни сцену, ни образец в сетке.
      const renamed = await page.request.patch("/api/users/me", { data: { name: longName } });
      expect(renamed.ok()).toBeTruthy();
      await page.reload();
      await expect(stage).toBeVisible();

      const nameLayout = await stage.evaluate((element) => {
        const heading = element.querySelector("h2") as HTMLElement;
        return {
          stageWidth: element.getBoundingClientRect().width,
          headingWidth: heading.getBoundingClientRect().width,
        };
      });
      expect(nameLayout.headingWidth).toBeLessThanOrEqual(nameLayout.stageWidth);
      await expect(page.getByTestId(`profile-swatch-${me.id}`)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        ),
      ).toBe(false);
    } finally {
      const restoreResponse = await page.request.patch("/api/users/me", {
        data: { giftPreferences: originalUser.giftPreferences, name: originalUser.name },
      });
      expect(restoreResponse.ok()).toBeTruthy();
    }
  });
}
