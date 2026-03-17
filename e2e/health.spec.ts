import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("GET /api/health возвращает 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
