import { describe, expect, it } from "vitest";
import { inferTelegramLinkStatus } from "./link-status";

describe("telegram linking", () => {
  it("returns not_configured without telegramId", () => {
    expect(
      inferTelegramLinkStatus({ telegramId: null, telegramConfirmedAt: null })
    ).toBe("not_configured");
  });

  it("returns pending when id exists but not confirmed", () => {
    expect(
      inferTelegramLinkStatus({ telegramId: "123456789", telegramConfirmedAt: null })
    ).toBe("pending");
  });

  it("returns linked when confirmation exists", () => {
    expect(
      inferTelegramLinkStatus({
        telegramId: "123456789",
        telegramConfirmedAt: new Date("2026-03-27T00:00:00.000Z"),
      })
    ).toBe("linked");
  });
});

