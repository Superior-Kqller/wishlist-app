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

test("desktop-user-filter-no-all-my-tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await loginAsUser(page);

  await expect(page.getByRole("tab", { name: "Все" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Мои" })).toHaveCount(0);

  const userTrigger = page.getByTestId("combined-user-trigger");
  await expect(userTrigger).toBeVisible();
  await expect(userTrigger).toContainText("Все пользователи");

  await userTrigger.click();
  await expect(page.getByTestId("combined-user-option-all")).toBeVisible();
  await expect(page.getByTestId("combined-user-option-me")).toBeVisible();
});

test("desktop-user-change-resets-list", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await loginAsUser(page);

  const listTrigger = page.getByRole("combobox", { name: /Все подборки|Подборка/ });
  await expect(listTrigger).toBeVisible();

  await page.getByTestId("combined-user-trigger").click();
  await page.getByTestId("combined-user-option-me").click();

  await expect(page).toHaveURL(/(?:\?|&)userId=me(?:&|$)/);
  // Подборка сбрасывается на «все» — без listId в query
  await expect(page).not.toHaveURL(/(?:\?|&)listId=/);
});

