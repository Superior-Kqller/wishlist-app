import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./helpers/auth";

const scenarios = [
  { name: "desktop classic", width: 1440, height: 900, theme: "classic" },
  { name: "desktop light", width: 1440, height: 900, theme: "light" },
  { name: "phone classic", width: 390, height: 844, theme: "classic" },
  { name: "phone light", width: 390, height: 844, theme: "light" },
] as const;

async function openCreateDialog(page: Page) {
  const addItemCard = page.getByTestId("add-item-card");
  await expect(addItemCard).toBeVisible();
  await addItemCard.click();
  return page.getByRole("dialog", { name: "Добавить товар" });
}

for (const scenario of scenarios) {
  test(`create modes: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.addInitScript((theme) => {
      window.localStorage.setItem("wishlist-color-theme", theme);
    }, scenario.theme);

    let parseAttempt = 0;
    const parsedTitle = `E2E ${scenario.name} ${Date.now()}`;
    await page.route("**/api/parse", async (route) => {
      parseAttempt += 1;
      if (parseAttempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({ message: "Тестовая ошибка разбора" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          title: parsedTitle,
          price: 14990,
          currency: "RUB",
          images: ["https://example.com/item.jpg"],
          description: "Описание из тестового ответа",
        }),
      });
    });

    await loginAsUser(page);
    await expect(page.locator("html")).toHaveClass(new RegExp(`theme-${scenario.theme}`));

    const addItemCard = page.getByTestId("add-item-card");
    const dialog = await openCreateDialog(page);
    await expect(dialog.getByTestId("item-create-link-stage")).toBeVisible();
    await expect(dialog.getByLabel("Название")).toHaveCount(0);

    const firstUrl = "https://example.com/draft";
    await dialog.getByLabel("Ссылка на товар").fill(firstUrl);
    const manualMode = dialog.getByRole("button", { name: "Вручную", exact: true });
    await manualMode.focus();
    await page.keyboard.press("Enter");
    await expect(dialog.getByLabel("Ссылка (необязательно)")).toHaveValue(firstUrl);
    await dialog.getByLabel("Название").fill("Черновик вручную");

    const linkMode = dialog.getByRole("button", { name: "По ссылке", exact: true });
    await linkMode.focus();
    await page.keyboard.press("Space");
    await expect(dialog.getByLabel("Ссылка на товар")).toHaveValue(firstUrl);
    await dialog.getByRole("button", { name: "Вручную", exact: true }).click();
    await expect(dialog.getByLabel("Название")).toHaveValue("Черновик вручную");

    await dialog.getByRole("button", { name: "По ссылке", exact: true }).click();
    await dialog.getByLabel("Ссылка на товар").fill("https://example.com/broken");
    await dialog.getByRole("button", { name: "Заполнить по ссылке" }).click();
    await expect(dialog.getByRole("status")).toContainText("Получаем данные по ссылке");
    await expect(dialog.getByRole("alert")).toContainText("Тестовая ошибка разбора");

    await dialog.getByRole("button", { name: "Продолжить вручную" }).click();
    await expect(dialog.getByLabel("Название")).toBeVisible();
    await dialog.getByRole("button", { name: "По ссылке", exact: true }).click();
    await dialog.getByLabel("Ссылка на товар").fill("https://example.com/success");
    await dialog.getByRole("button", { name: "Заполнить по ссылке" }).click();

    await expect(dialog.getByRole("status")).toContainText("Данные получены");
    await expect(dialog.getByLabel("Название")).toHaveValue(parsedTitle);
    await expect(dialog.getByLabel("Название")).toBeFocused();
    await expect(dialog.getByLabel("Ориентировочная цена")).toHaveValue("14990");
    await expect(dialog.getByLabel("Заметка")).toHaveValue("Описание из тестового ответа");

    const createResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/items") && response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
    expect((await createResponse).ok()).toBeTruthy();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByTestId("wishlist-card-v2").filter({ hasText: parsedTitle }).first(),
    ).toBeVisible();

    const manualTitle = `Manual ${scenario.name} ${Date.now()}`;
    const manualDialog = await openCreateDialog(page);
    const manualModeButton = manualDialog.getByRole("button", {
      name: "Вручную",
      exact: true,
    });
    await manualModeButton.focus();
    await page.keyboard.press("Enter");
    await manualDialog.getByLabel("Название").fill(manualTitle);

    const manualCreateResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/items") && response.request().method() === "POST",
    );
    await manualDialog.getByRole("button", { name: "Добавить", exact: true }).click();
    expect((await manualCreateResponse).ok()).toBeTruthy();
    await expect(manualDialog).toBeHidden();
    await expect(
      page.getByTestId("wishlist-card-v2").filter({ hasText: manualTitle }).first(),
    ).toBeVisible();
    await expect(addItemCard).toBeFocused();
  });
}

test("creation mode labels are available in English", async ({ page }) => {
  await loginAsUser(page);
  await page.evaluate(() => window.localStorage.setItem("wishlist-language", "en"));
  await page.reload();

  const addItemCard = page.getByTestId("add-item-card");
  await expect(addItemCard).toBeVisible();
  await addItemCard.click();

  const dialog = page.getByRole("dialog", { name: "Add item" });
  await expect(dialog.getByRole("button", { name: "From a link", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Manually", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(addItemCard).toBeFocused();
});

test("editing opens the full form without link autofill", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await firstCard.hover();
  await firstCard.getByTestId("wishlist-card-edit").click();

  const dialog = page.getByRole("dialog", { name: "Редактировать" });
  await expect(dialog.getByLabel("Название")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "По ссылке", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Заполнить по ссылке" })).toHaveCount(0);
});
