import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * На телефоне по умолчанию — список: плитки «Добавить» в конце сетки там нет,
 * добавляют плавающей кнопкой, а желание появляется строкой, а не карточкой.
 */
const scenarios = [
  {
    name: "desktop",
    width: 1440,
    height: 900,
    entry: (page: Page) => page.getByTestId("add-item-card"),
    itemTestId: "wishlist-card-v2",
  },
  {
    name: "phone",
    width: 390,
    height: 844,
    entry: (page: Page) => page.getByRole("button", { name: "Добавить желание" }),
    itemTestId: "wishlist-list-row",
  },
] as const;

async function openCreateDialog(page: Page, entry: Locator) {
  await expect(entry).toBeVisible();
  await entry.click();
  return page.getByRole("dialog", { name: "Добавить желание" });
}

for (const scenario of scenarios) {
  test(`create modes: ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
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

    await page.goto("/");

    const entry = scenario.entry(page);
    const dialog = await openCreateDialog(page, entry);
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
      page.getByTestId(scenario.itemTestId).filter({ hasText: parsedTitle }).first(),
    ).toBeVisible();

    const manualTitle = `Manual ${scenario.name} ${Date.now()}`;
    const manualDialog = await openCreateDialog(page, entry);
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
      page.getByTestId(scenario.itemTestId).filter({ hasText: manualTitle }).first(),
    ).toBeVisible();
    await expect(entry).toBeFocused();
  });
}

test("creation mode labels are available in English", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.setItem("wishlist-language", "en"));
  await page.reload();

  const addItemCard = page.getByTestId("add-item-card");
  await expect(addItemCard).toBeVisible();
  await addItemCard.click();

  const dialog = page.getByRole("dialog", { name: "Add a wish" });
  await expect(dialog.getByRole("button", { name: "From a link", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Manually", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(addItemCard).toBeFocused();
});

test("editing opens the full form without link autofill", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByTestId("wishlist-card-actions").click();
  await page.getByRole("menuitem", { name: "Редактировать" }).click();

  const dialog = page.getByRole("dialog", { name: "Редактировать" });
  await expect(dialog.getByLabel("Название")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "По ссылке", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Заполнить по ссылке" })).toHaveCount(0);
});
