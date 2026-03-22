import { expect, test, type Page } from "@playwright/test";

const E2E_USERNAME = "user1";
const E2E_PASSWORD = "changeme";

async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Логин").fill(E2E_USERNAME);
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL("**/");
}

test("card-baseline-actions-and-priority", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await firstCard.hover();

  const editButton = firstCard.getByTestId("wishlist-card-edit");
  const deleteButton = firstCard.getByTestId("wishlist-card-delete");
  await expect(editButton).toBeVisible();
  await expect(deleteButton).toBeVisible();

  const priorityControl = firstCard.getByTestId("wishlist-card-priority");
  await expect(priorityControl).toBeVisible();
  await priorityControl.click();
});

test("card-priority-select-visible-and-changeable", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  const prioritySelect = firstCard.getByTestId("priority-select-trigger");
  await expect(prioritySelect).toBeVisible();

  await prioritySelect.click();
  await page.getByRole("option", { name: "P5" }).click();
  await expect(prioritySelect).toContainText("P5");
});

test("card-v2-layout-price-in-footer", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  const media = firstCard.getByTestId("wishlist-card-v2-media");
  const footer = firstCard.getByTestId("wishlist-card-v2-footer");
  const price = firstCard.getByTestId("wishlist-card-v2-price");
  const title = firstCard.getByTestId("wishlist-card-v2-title");

  await expect(media).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(price).toBeVisible();
  await expect(media.getByTestId("wishlist-card-v2-price")).toHaveCount(0);
  await expect(title).toHaveClass(/line-clamp-2/);
});

test("card-v2-actions-are-labeled-and-keyboard-accessible", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await firstCard.hover();

  const editAction = firstCard.getByRole("button", { name: "Редактировать" });
  const deleteAction = firstCard.getByRole("button", { name: "Удалить" });

  await expect(editAction).toBeVisible();
  await expect(deleteAction).toBeVisible();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await editAction.focus();
  await expect(editAction).toBeFocused();
  await editAction.hover();
  await expect(page.getByRole("tooltip", { name: "Редактировать" })).toBeVisible();
});

test("card-v2-title-tooltip-shows-full-name", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  const title = firstCard.getByTestId("wishlist-card-v2-title");
  const fullTitle = "Very long wishlist title for e2e tooltip verification and two line clamp behavior";

  await expect(title).toHaveClass(/line-clamp-2/);
  await title.focus();
  await expect(page.getByRole("tooltip", { name: fullTitle })).toBeVisible();
});

test("add-item-cta-copy-is-clear", async ({ page }) => {
  await loginAsUser(page);

  const addItemCard = page.getByTestId("add-item-card");
  await expect(addItemCard).toBeVisible();
  await addItemCard.click();

  await expect(page.getByText("По ссылке / Вручную")).toBeVisible();
});

test("card-v2-no-priority-colored-border", async ({ page }) => {
  await loginAsUser(page);

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).not.toHaveClass(/border-l-4/);
});
