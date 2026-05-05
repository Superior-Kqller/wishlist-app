import type { Page } from "@playwright/test";

const E2E_USERNAME =
  process.env.E2E_USERNAME ?? process.env.SEED_USER1_USERNAME ?? "user1";
const E2E_PASSWORD =
  process.env.E2E_PASSWORD ?? process.env.SEED_USER1_PASSWORD ?? "changeme";

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Логин").fill(E2E_USERNAME);
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL("**/");
}
