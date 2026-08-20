import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const longSize = `Размер-${"оченьдлинноезначение".repeat(8)}`;
const longBudget = `До-${"1234567890".repeat(18)}-рублей`;
const longOccasion = `Повод-${"безпробелов".repeat(6)}`;
const longNotes = `Первая строка заметки\n${"непрерывнаядлиннаязаметка".repeat(20)}`;
const longName = "Александринапетровнаконстантинопольская-Зауральская";

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

      // Длинное имя ломало раскладку иначе, чем длинные значения: у элемента
      // grid минимальный размер по умолчанию равен min-content, и колонка
      // растягивалась за край экрана вместе с именем, унося кнопку раскрытия.
      const renamed = await page.request.patch("/api/users/me", { data: { name: longName } });
      expect(renamed.ok()).toBeTruthy();
      await page.reload();
      await expect(ownProfile).toBeVisible();

      const nameLayout = await ownProfile.evaluate((element) => {
        const heading = element.querySelector("h2") as HTMLElement;
        return {
          cardWidth: element.getBoundingClientRect().width,
          headingWidth: heading.getBoundingClientRect().width,
          headingClipped: heading.scrollWidth > heading.clientWidth,
        };
      });
      // На телефоне имя обязано обрезаться, на десктопе оно помещается целиком.
      if (scenario.width < 768) {
        expect(nameLayout.headingClipped).toBe(true);
      }
      expect(nameLayout.headingWidth).toBeLessThanOrEqual(nameLayout.cardWidth);
      await expect(ownProfile.getByRole("button", { name: /Открыть профиль/ })).toBeVisible();
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
