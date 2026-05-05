import type { Page } from "@playwright/test";

function envOrFallback(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

const E2E_USERNAME = envOrFallback(
  process.env.E2E_USERNAME ?? process.env.SEED_USER1_USERNAME,
  "user1",
);
const E2E_PASSWORD = envOrFallback(
  process.env.E2E_PASSWORD ?? process.env.SEED_USER1_PASSWORD,
  "changeme",
);

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Логин").fill(E2E_USERNAME);
  await page.getByLabel("Пароль").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL("**/");
}
