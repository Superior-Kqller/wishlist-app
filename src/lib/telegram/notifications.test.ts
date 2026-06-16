import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFindUnique = vi.fn();
const mockSendTelegramMessage = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/telegram/client", () => ({
  sendTelegramMessage: mockSendTelegramMessage,
}));

describe("telegram notifications", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      TELEGRAM_BOT_TOKEN: "token",
      TELEGRAM_CHAT_IDS: "123456789,-1001234567890",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("does not send reservation notifications", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "actor-1", name: "Аня" })
      .mockResolvedValue({ telegramId: null, telegramConfirmedAt: null, telegramNotificationsEnabled: false });

    const { notifyStatusTransition } = await import("./notifications");

    await notifyStatusTransition({
      itemId: "item-1",
      itemTitle: "Книга",
      ownerUserId: "owner-1",
      actorUserId: "actor-1",
      previousStatus: "AVAILABLE",
      nextStatus: "CLAIMED",
      previousClaimerUserId: null,
      nextClaimerUserId: "actor-1",
    });

    expect(mockSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("sends purchased notifications with emoji to configured chat ids", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "actor-1", name: "Аня" })
      .mockResolvedValue({ telegramId: null, telegramConfirmedAt: null, telegramNotificationsEnabled: false });

    const { notifyStatusTransition } = await import("./notifications");

    await notifyStatusTransition({
      itemId: "item-1",
      itemTitle: "Книга",
      ownerUserId: "owner-1",
      actorUserId: "actor-1",
      previousStatus: "AVAILABLE",
      nextStatus: "PURCHASED",
      previousClaimerUserId: null,
      nextClaimerUserId: null,
    });

    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: "✅ Подарок куплен\n👤 Аня\n📌 Книга",
    });
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "-1001234567890",
      text: "✅ Подарок куплен\n👤 Аня\n📌 Книга",
    });
  });

  it("sends item created notifications to configured chat ids", async () => {
    const { notifyItemCreated } = await import("./notifications");

    await notifyItemCreated({
      itemId: "item-1",
      itemTitle: "Книга",
      actorUserId: "user-1",
      actorName: "Аня",
    });

    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: "🎁 Новый подарок\n👤 Аня\n📌 Книга",
    });
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "-1001234567890",
      text: "🎁 Новый подарок\n👤 Аня\n📌 Книга",
    });
  });
});
