import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTelegramBot } from "./client";

const { mockSanitizeError } = vi.hoisted(() => ({ mockSanitizeError: vi.fn() }));
vi.mock("@/lib/logger", () => ({ sanitizeError: mockSanitizeError, sanitizeLog: vi.fn() }));

function telegramResponse(body: unknown, status = 200) {
  // Новый ответ на каждый вызов: тело Response читается только один раз.
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe("startTelegramBot", () => {
  const originalEnv = process.env;
  const fetchMock = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    process.env = { ...originalEnv, TELEGRAM_BOT_TOKEN: "token" };
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    mockSanitizeError.mockReset();
    onUpdate.mockReset().mockResolvedValue(undefined);
    fetchMock.mockReset().mockImplementation(() => telegramResponse({ ok: true, result: true }));
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

  describe("без секрета — опрос getUpdates", () => {
    it("снимает вебхук без сброса очереди, забирает обновления и подтверждает их", async () => {
      const controller = new AbortController();
      const batches = [[{ update_id: 7 }, { update_id: 8 }], []];
      fetchMock.mockImplementation((url: string) => {
        if (!url.endsWith("/getUpdates")) return telegramResponse({ ok: true, result: true });
        const batch = batches.shift() ?? [];
        if (batches.length === 0) controller.abort();
        return telegramResponse({ ok: true, result: batch });
      });

      await startTelegramBot("http://192.168.1.10:4030", onUpdate, controller.signal);

      const polled = calls().filter((call) => call.method !== "setMyCommands");
      expect(polled.map((call) => call.method)).toEqual([
        "deleteWebhook",
        "getUpdates",
        "getUpdates",
      ]);
      // Без drop_pending_updates: «Старт», нажатые до запуска, не теряются.
      expect(polled[0].body).toEqual({});
      expect(polled.slice(1).map((call) => call.body.offset)).toEqual([0, 9]);
      expect(polled[1].body.allowed_updates).toContain("inline_query");
      expect(onUpdate.mock.calls.map(([update]) => update.update_id)).toEqual([7, 8]);
      expect(mockSanitizeError).not.toHaveBeenCalled();
    });

    it("переживает ошибки Telegram и обработчика, не роняя сервер", async () => {
      const controller = new AbortController();
      onUpdate.mockRejectedValue(new Error("boom"));
      let polls = 0;
      fetchMock.mockImplementation((url: string) => {
        if (!url.endsWith("/getUpdates")) return telegramResponse({ ok: true, result: true });
        if (++polls === 1) return telegramResponse({ ok: true, result: [{ update_id: 1 }] });
        // Второй процесс с тем же токеном: Telegram отвечает 409, опрос ждёт и пробует снова.
        controller.abort();
        return telegramResponse({ ok: false, description: "Conflict" }, 409);
      });

      await expect(
        startTelegramBot(undefined, onUpdate, controller.signal),
      ).resolves.toBeUndefined();
      await vi.waitFor(() =>
        expect(mockSanitizeError).toHaveBeenCalledWith(
          "Telegram update handling error",
          expect.any(Error),
        ),
      );
      expect(mockSanitizeError).toHaveBeenCalledWith("Telegram polling error", expect.any(Error));
    });
  });

  describe("с секретом — вебхук", () => {
    beforeEach(() => {
      process.env.TELEGRAM_WEBHOOK_SECRET = "secret_1";
    });

    it("ставит вебхук с секретом на https-адрес приложения и меню команд", async () => {
      await startTelegramBot("https://wish.example.com/", onUpdate);

      expect(calls()).toEqual([
        {
          method: "setMyCommands",
          body: expect.objectContaining({ scope: { type: "all_private_chats" } }),
        },
        {
          method: "setMyCommands",
          body: expect.objectContaining({ scope: { type: "all_group_chats" } }),
        },
        {
          method: "setWebhook",
          body: {
            url: "https://wish.example.com/api/integrations/telegram/webhook",
            secret_token: "secret_1",
            allowed_updates: ["message", "callback_query", "inline_query"],
          },
        },
      ]);
      // Ошибки настройки глушатся в лог — значит, их отсутствие проверяем по логу.
      expect(mockSanitizeError).not.toHaveBeenCalled();
    });

    it("на http вебхук не ставит и опрос не запускает", async () => {
      await startTelegramBot("http://192.168.1.10:4030", onUpdate);

      expect(calls().map((call) => call.method)).toEqual(["setMyCommands", "setMyCommands"]);
    });

    it("не роняет старт приложения, если Telegram ответил ошибкой", async () => {
      fetchMock.mockImplementation(() =>
        telegramResponse({ ok: false, description: "Bad Request" }, 400),
      );

      await expect(startTelegramBot("https://wish.example.com", onUpdate)).resolves.toBeUndefined();
      expect(mockSanitizeError).toHaveBeenCalledTimes(2);
    });
  });

  it("без токена ничего не делает", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    await startTelegramBot("https://wish.example.com", onUpdate);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
