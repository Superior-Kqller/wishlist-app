import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHandleTelegramUpdate = vi.fn();
const mockGetTelegramConfig = vi.fn();

vi.mock("@/lib/telegram/actions", () => ({
  handleTelegramUpdate: mockHandleTelegramUpdate,
}));

vi.mock("@/lib/telegram/config", () => ({
  getTelegramConfig: mockGetTelegramConfig,
}));

describe("telegram webhook route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 503 when telegram is not configured", async () => {
    mockGetTelegramConfig.mockReturnValue({ enabled: false, botToken: "" });
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/integrations/telegram/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ update_id: 1 }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(503);
    expect(mockHandleTelegramUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 when webhook secret is invalid", async () => {
    mockGetTelegramConfig.mockReturnValue({
      enabled: true,
      botToken: "token",
      webhookSecret: "expected-secret",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/integrations/telegram/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": "bad-secret" },
      body: JSON.stringify({ update_id: 1 }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(401);
    expect(mockHandleTelegramUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    mockGetTelegramConfig.mockReturnValue({
      enabled: true,
      botToken: "token",
      webhookSecret: "expected-secret",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/integrations/telegram/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": "expected-secret",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(400);
    expect(mockHandleTelegramUpdate).not.toHaveBeenCalled();
  });

  it("handles valid update", async () => {
    mockGetTelegramConfig.mockReturnValue({
      enabled: true,
      botToken: "token",
      webhookSecret: "expected-secret",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/integrations/telegram/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-bot-api-secret-token": "expected-secret",
      },
      body: JSON.stringify({ update_id: 100, message: { text: "/start", chat: { id: 1, type: "private" } } }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(200);
    expect(mockHandleTelegramUpdate).toHaveBeenCalledTimes(1);
  });
});
