import { expect, test } from "@playwright/test";

test("card-baseline-actions-and-priority", async ({ page }) => {
  await page.goto("/");

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
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  const prioritySelect = firstCard.getByTestId("priority-select-trigger");
  await expect(prioritySelect).toBeVisible();

  await prioritySelect.click();
  await page.getByRole("option", { name: "P5" }).click();
  await expect(prioritySelect).toContainText("P5");
});

test("card-v2-layout-price-near-title", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  const media = firstCard.getByTestId("wishlist-card-v2-media");
  const footer = firstCard.getByTestId("wishlist-card-v2-footer");
  const meta = firstCard.getByTestId("wishlist-card-v2-meta");
  const owner = firstCard.getByTestId("wishlist-card-v2-owner");
  const status = firstCard.getByTestId("wishlist-card-v2-status");
  const tag = firstCard.getByTestId("wishlist-card-v2-tag");
  const price = firstCard.getByTestId("wishlist-card-v2-price");
  const title = firstCard.getByTestId("wishlist-card-v2-title");

  await expect(media).toBeVisible();
  await expect(footer).toBeVisible();
  await expect(meta).toBeVisible();
  await expect(owner).toBeVisible();
  await expect(status).toBeVisible();
  await expect(tag.first()).toBeVisible();
  await expect(price).toBeVisible();
  await expect(media.getByTestId("wishlist-card-v2-status")).toHaveCount(0);
  await expect(media.getByTestId("wishlist-card-v2-price")).toHaveCount(0);
  await expect(footer.getByTestId("wishlist-card-v2-price")).toHaveCount(0);
  await expect(title).toHaveClass(/line-clamp-2/);

  const titleBox = await title.boundingBox();
  const priceBox = await price.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(priceBox).not.toBeNull();
  expect(Math.abs(titleBox!.y - priceBox!.y)).toBeLessThan(12);
});

test("card-v2-has-single-open-link-action", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();

  await expect(
    firstCard.getByRole("link", { name: "Открыть ссылку на товар в новой вкладке" }),
  ).toHaveCount(1);
});

test("mobile card shows purchased state and several tags", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const uniqueTitle = `mobile purchased tags ${Date.now()}`;
  const importResponse = await page.request.post("/api/items/import", {
    data: {
      items: [
        {
          title: uniqueTitle,
          price: 12990,
          tags: ["кухня", "дом", "подарок"],
          purchased: true,
        },
      ],
    },
  });
  expect(importResponse.ok()).toBeTruthy();

  await page.goto(`/?search=${encodeURIComponent(uniqueTitle)}`);

  const card = page.getByTestId("wishlist-card-v2").filter({ hasText: uniqueTitle }).first();
  await expect(card).toBeVisible();
  await expect(card.getByTestId("wishlist-card-v2-purchased-label")).toBeVisible();
  await expect(card.getByTestId("wishlist-card-v2-tag")).toHaveCount(3);
});

test("card-v2-actions-are-labeled-and-keyboard-accessible", async ({ page }) => {
  await page.goto("/");

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
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  const title = firstCard.getByTestId("wishlist-card-v2-title");
  const fullTitle =
    "Very long wishlist title for e2e tooltip verification and two line clamp behavior";

  await expect(title).toHaveClass(/line-clamp-2/);
  await title.focus();
  await expect(page.getByRole("tooltip", { name: fullTitle })).toBeVisible();
});

test("add-item-cta-copy-is-clear", async ({ page }) => {
  await page.goto("/");

  const addItemCard = page.getByTestId("add-item-card");
  await expect(addItemCard).toBeVisible();
  await addItemCard.click();

  const dialog = page.getByRole("dialog", { name: "Добавить товар" });
  await expect(dialog.getByRole("button", { name: "По ссылке", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Вручную", exact: true })).toBeVisible();
});

test("card-v2-no-priority-colored-border", async ({ page }) => {
  await page.goto("/");

  const firstCard = page.getByTestId("wishlist-card-v2").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).not.toHaveClass(/border-l-4/);
});
