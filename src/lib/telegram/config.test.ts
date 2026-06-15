import { afterEach, describe, expect, it } from "vitest";
import { getTelegramConfig } from "./config";

describe("telegram config", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("parses configured chat ids from comma-separated env", () => {
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: "token",
      TELEGRAM_CHAT_IDS: "123456789, -1001234567890, , 987654321",
    };

    expect(getTelegramConfig()).toMatchObject({
      enabled: true,
      botToken: "token",
      chatIds: ["123456789", "-1001234567890", "987654321"],
    });
  });
});
