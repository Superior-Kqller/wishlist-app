import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendTelegramMessage = vi.fn();
const mockAnswerTelegramCallback = vi.fn();

vi.mock("@/lib/telegram/client", () => ({
  sendTelegramMessage: mockSendTelegramMessage,
  answerTelegramCallback: mockAnswerTelegramCallback,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("telegram actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupLinkedActor() {
    const { prisma } = await import("@/lib/prisma");
    const mockFindFirst = prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>;
    mockFindFirst.mockResolvedValue({
      id: "actor-1",
      name: "Аня",
      telegramId: "123456789",
      telegramConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
      telegramNotificationsEnabled: true,
    });

    return { prisma };
  }

  const availableItem = {
    id: "item-1",
    title: "Чужой подарок",
    price: 1000,
    currency: "RUB",
    list: { userId: "owner-1", user: { name: "Оля" } },
  };

  const myItems = [
    {
      id: "item-mine",
      title: "Мой приватный подарок",
      status: "AVAILABLE" as const,
      userId: "actor-1",
    },
  ];

  it("responds with chat id before requiring account linking", async () => {
    const { handleTelegramUpdate } = await import("./actions");

    await handleTelegramUpdate({
      update_id: 1,
      message: {
        message_id: 10,
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        chat: { id: -1001234567890, type: "supergroup" },
        text: "/chatid",
      },
    });

    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "-1001234567890",
      text: "Chat ID этого чата: -1001234567890",
    });
  });

  it.each(["group", "supergroup", "channel"] as const)(
    "does not query or disclose /available details in a %s chat",
    async (chatType) => {
      const { prisma } = await setupLinkedActor();
      const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
      mockFindMany.mockResolvedValue([availableItem]);

      const { handleTelegramUpdate } = await import("./actions");
      await handleTelegramUpdate({
        update_id: 2,
        message: {
          message_id: 20,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: -1001234567890, type: chatType },
          text: "/available",
        },
      });

      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        chatId: "-1001234567890",
        text: "Команда доступна только в личном чате.",
      });
    },
  );

  it("keeps /available details for a linked private chat", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue([availableItem]);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 3,
      message: {
        message_id: 30,
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        chat: { id: 123456789, type: "private" },
        text: "/available",
      },
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: expect.stringContaining("Чужой подарок"),
    });
  });

  it("does not query or disclose /available details from a group menu callback", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue([availableItem]);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 4,
      callback_query: {
        id: "callback-1",
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        message: {
          message_id: 40,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: -1001234567890, type: "supergroup" },
        },
        data: "menu:available",
      },
    });

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith({
      callbackQueryId: "callback-1",
      text: "Команда доступна только в личном чате.",
      showAlert: true,
    });
  });

  it("keeps the private menu callback behavior for /available", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue([availableItem]);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 5,
      callback_query: {
        id: "callback-2",
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        message: {
          message_id: 50,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: 123456789, type: "private" },
        },
        data: "menu:available",
      },
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: expect.stringContaining("Чужой подарок"),
    });
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith({ callbackQueryId: "callback-2" });
  });

  it.each(["group", "supergroup", "channel"] as const)(
    "does not query or disclose /myitems details in a %s chat",
    async (chatType) => {
      const { prisma } = await setupLinkedActor();
      const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
      mockFindMany.mockResolvedValue(myItems);

      const { handleTelegramUpdate } = await import("./actions");
      await handleTelegramUpdate({
        update_id: 6,
        message: {
          message_id: 60,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: -1001234567890, type: chatType },
          text: "/myitems",
        },
      });

      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockSendTelegramMessage).toHaveBeenCalledWith({
        chatId: "-1001234567890",
        text: "Команда доступна только в личном чате.",
      });
    },
  );

  it("keeps /myitems details for a linked private chat", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue(myItems);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 7,
      message: {
        message_id: 70,
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        chat: { id: 123456789, type: "private" },
        text: "/myitems",
      },
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: expect.stringContaining("Мой приватный подарок [AVAILABLE]"),
      replyMarkup: expect.anything(),
    });
  });

  it("does not query or disclose /myitems details from a group menu callback", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue(myItems);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 8,
      callback_query: {
        id: "callback-3",
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        message: {
          message_id: 80,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: -1001234567890, type: "group" },
        },
        data: "menu:mine",
      },
    });

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith({
      callbackQueryId: "callback-3",
      text: "Команда доступна только в личном чате.",
      showAlert: true,
    });
  });

  it("keeps the private menu callback behavior for /myitems", async () => {
    const { prisma } = await setupLinkedActor();
    const mockFindMany = prisma.item.findMany as unknown as ReturnType<typeof vi.fn>;
    mockFindMany.mockResolvedValue(myItems);

    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 9,
      callback_query: {
        id: "callback-4",
        from: { id: 123456789, is_bot: false, first_name: "Аня" },
        message: {
          message_id: 90,
          from: { id: 123456789, is_bot: false, first_name: "Аня" },
          chat: { id: 123456789, type: "private" },
        },
        data: "menu:mine",
      },
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "123456789",
      text: expect.stringContaining("Мой приватный подарок [AVAILABLE]"),
      replyMarkup: expect.anything(),
    });
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith({ callbackQueryId: "callback-4" });
  });
});
