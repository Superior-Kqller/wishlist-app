import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupTelegramBot } from "./client";

const { mockSanitizeError } = vi.hoisted(() => ({ mockSanitizeError: vi.fn() }));
vi.mock("@/lib/logger", () => ({ sanitizeError: mockSanitizeError }));

describe("setupTelegramBot", () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: "token",
      TELEGRAM_WEBHOOK_SECRET: "secret_1",
    };
    mockSanitizeError.mockReset();
    fetchMock
      .mockReset()
      // Новый ответ на каждый вызов: тело Response читается только один раз.
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ ok: true, result: true }), { status: 200 })),
      );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  function calls() {
    return fetchMock.mock.calls.map(([url, init]) => ({
      method: String(url).split("/").pop(),
      body: JSON.parse((init as RequestInit).body as string),
    }));
  }

  it("ставит вебхук с секретом на https-адрес приложения и меню команд", async () => {
    await setupTelegramBot("https://wish.example.com/");

    expect(calls()).toEqual([
      {
        method: "setWebhook",
        body: {
          url: "https://wish.example.com/api/integrations/telegram/webhook",
          secret_token: "secret_1",
          allowed_updates: ["message", "callback_query", "inline_query"],
        },
      },
      {
        method: "setMyCommands",
        body: expect.objectContaining({ scope: { type: "all_private_chats" } }),
      },
      {
        method: "setMyCommands",
        body: expect.objectContaining({ scope: { type: "all_group_chats" } }),
      },
    ]);
    // Ошибки настройки глушатся в лог — значит, их отсутствие проверяем по логу.
    expect(mockSanitizeError).not.toHaveBeenCalled();
  });

  it("не трогает Telegram без секрета или на http: вебхук нельзя защитить или до него не дойти", async () => {
    await setupTelegramBot("http://192.168.1.10:4030");
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    await setupTelegramBot("https://wish.example.com");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("не роняет старт приложения, если Telegram ответил ошибкой", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: false, description: "Bad Request" }), { status: 400 }),
      ),
    );

    await expect(setupTelegramBot("https://wish.example.com")).resolves.toBeUndefined();
    expect(mockSanitizeError).toHaveBeenCalledOnce();
  });
});
