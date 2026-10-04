import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSendTelegramMessage = vi.fn();
const mockAnswerTelegramCallback = vi.fn();
const mockEditTelegramMessage = vi.fn();
const mockParseWishlistProductUrl = vi.fn();
const mockNotifyItemCreated = vi.fn();

vi.mock("@/lib/telegram/client", () => ({
  sendTelegramMessage: mockSendTelegramMessage,
  answerTelegramCallback: mockAnswerTelegramCallback,
  editTelegramMessage: mockEditTelegramMessage,
  sendTelegramTyping: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/parser", () => ({ parseWishlistProductUrl: mockParseWishlistProductUrl }));

vi.mock("@/lib/telegram/notifications", () => ({
  notifyItemCreated: mockNotifyItemCreated,
  notifyStatusTransition: vi.fn(),
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
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    list: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
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
      text: expect.stringContaining("Мой приватный подарок · Доступно"),
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
      text: expect.stringContaining("Мой приватный подарок · Доступно"),
      replyMarkup: expect.anything(),
    });
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith({ callbackQueryId: "callback-4" });
  });
});

describe("привязка по ссылке /start <токен>", () => {
  const tokenUser = {
    id: "user-1",
    name: "Аня",
    telegramLinkTokenExpiresAt: new Date(Date.now() + 60_000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setup(
    holder: { id: string; telegramConfirmedAt: Date | null } | null,
    owner: typeof tokenUser | null = tokenUser,
  ) {
    const { prisma } = await import("@/lib/prisma");
    const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
    findUnique.mockImplementation(({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(where.telegramLinkTokenHash ? owner : holder),
    );
    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (run: (tx: typeof prisma) => unknown) => run(prisma),
    );
    return { findUnique, update: prisma.user.update as unknown as ReturnType<typeof vi.fn> };
  }

  async function start(text: string, chatType: "private" | "group" = "private") {
    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 555, is_bot: false, first_name: "Аня", username: "anya" },
        chat: { id: 555, type: chatType },
        text,
      },
    });
  }

  it("привязывает Telegram, из которого открыли ссылку, и гасит токен", async () => {
    const { update } = await setup(null);

    await start("/start@wishlist_bot tok_123-abc");

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        telegramId: "555",
        telegramUsername: "anya",
        telegramConfirmedAt: expect.any(Date),
        telegramNotificationsEnabled: true,
        telegramLinkTokenHash: null,
        telegramLinkTokenExpiresAt: null,
      }),
    });
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("подключен к аккаунту Аня") }),
    );
  });

  it("не принимает просроченный токен", async () => {
    const { update } = await setup(null, {
      ...tokenUser,
      telegramLinkTokenExpiresAt: new Date(Date.now() - 1),
    });

    await start("/start tok");

    expect(update).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("Ссылка устарела") }),
    );
  });

  it("не перехватывает Telegram, подтверждённый у другого аккаунта", async () => {
    const { update } = await setup({ id: "user-2", telegramConfirmedAt: new Date() });

    await start("/start tok");

    expect(update).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("другому аккаунту") }),
    );
  });

  it("снимает неподтверждённый ID, введённый когда-то вручную у другого аккаунта", async () => {
    const { update } = await setup({ id: "user-2", telegramConfirmedAt: null });

    await start("/start tok");

    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: "user-2" },
      data: { telegramId: null, telegramLinkedAt: null },
    });
    expect(update).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { id: "user-1" } }));
  });

  it("голый /start не подтверждает введённый вручную ID", async () => {
    const { update } = await setup(null);
    const { prisma } = await import("@/lib/prisma");
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await start("/start");

    expect(update).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("«Подключить Telegram»") }),
    );
  });

  it("не принимает токен в группе: уведомления ходят только в личный чат", async () => {
    const { findUnique } = await setup(null);

    await start("/start tok", "group");

    expect(findUnique).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "555",
      text: "Команда доступна только в личном чате.",
    });
  });
});

describe("желание по ссылке, присланной боту", () => {
  const lists = [
    { id: "list-b", name: "Мечты" },
    { id: "list-a", name: "Дом" },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/lib/prisma");
    (prisma.user.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "actor-1",
      name: "Аня",
    });
    (prisma.list.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(lists);
    (prisma.list.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "actor-1",
    });
    (prisma.item.create as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...data, id: "item-new", user: { name: "Аня" } }),
    );
  });

  async function send(text: string, chatType: "private" | "group" = "private") {
    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 555, is_bot: false, first_name: "Аня" },
        chat: { id: 555, type: chatType },
        text,
        entities: [{ type: "url", offset: 7, length: text.length - 7 }],
      },
    });
  }

  async function press(data: string) {
    const { handleTelegramUpdate } = await import("./actions");
    await handleTelegramUpdate({
      update_id: 2,
      callback_query: {
        id: "cb-1",
        from: { id: 555, is_bot: false, first_name: "Аня" },
        message: { message_id: 7, chat: { id: 555, type: "private" } },
        data,
      },
    });
  }

  it("кладёт желание в первую по алфавиту подборку и предлагает перенести или удалить", async () => {
    const { prisma } = await import("@/lib/prisma");
    mockParseWishlistProductUrl.mockResolvedValue({
      title: "  Наушники  ",
      price: Number.NaN,
      currency: "RUB",
      images: ["/relative.jpg"],
      url: "https://shop.ru/p/1",
    });

    await send("Хочу → shop.ru/p/1");

    expect(mockParseWishlistProductUrl).toHaveBeenCalledWith("https://shop.ru/p/1");
    // Невалидные цена и картинка отброшены, как их отбросил бы API.
    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Наушники",
          url: "https://shop.ru/p/1",
          price: null,
          images: [],
          listId: "list-a",
          userId: "actor-1",
        }),
      }),
    );
    expect(mockSendTelegramMessage).toHaveBeenCalledWith({
      chatId: "555",
      text: "🎁 Добавлено в «Дом»\n📌 Наушники",
      replyMarkup: {
        inline_keyboard: [
          [{ text: "Перенести в «Мечты»", callback_data: "mv:item-new:list-b" }],
          [{ text: "Удалить", callback_data: "rm:item-new" }],
        ],
      },
    });
    expect(mockNotifyItemCreated).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "item-new", actorUserId: "actor-1" }),
    );
  });

  it("кривая картинка не уносит верную цену", async () => {
    const { prisma } = await import("@/lib/prisma");
    mockParseWishlistProductUrl.mockResolvedValue({
      title: "Лампа",
      price: 5000,
      currency: "RUB",
      images: ["//cdn.shop.ru/x.jpg"],
      url: "https://shop.ru/p/2",
    });

    await send("Хочу → shop.ru/p/2");

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 5000, images: [] }),
      }),
    );
  });

  it("не трогает ссылки в группе", async () => {
    const { prisma } = await import("@/lib/prisma");

    await send("Хочу → shop.ru/p/1", "group");

    expect(mockParseWishlistProductUrl).not.toHaveBeenCalled();
    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).not.toHaveBeenCalled();
  });

  it("если страница не читается, ничего не создаёт и отправляет на сайт", async () => {
    const { prisma } = await import("@/lib/prisma");
    mockParseWishlistProductUrl.mockRejectedValue(new Error("fetch failed"));

    await send("Хочу → shop.ru/p/1");

    expect(prisma.item.create).not.toHaveBeenCalled();
    expect(mockSendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("Не удалось прочитать страницу") }),
    );
  });

  it("удаляет только своё желание", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.item.deleteMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    await press("rm:someone-elses");

    expect(prisma.item.deleteMany).toHaveBeenCalledWith({
      where: { id: "someone-elses", userId: "actor-1" },
    });
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Желание не найдено", showAlert: true }),
    );
    expect(mockEditTelegramMessage).not.toHaveBeenCalled();
  });

  it("не переносит в чужую подборку", async () => {
    const { prisma } = await import("@/lib/prisma");

    await press("mv:item-new:list-of-other-user");

    expect(prisma.item.updateMany).not.toHaveBeenCalled();
    expect(mockAnswerTelegramCallback).toHaveBeenCalledWith(
      expect.objectContaining({ showAlert: true }),
    );
  });

  it("переносит в свою подборку и обновляет сообщение", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.item.updateMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
    (prisma.item.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "item-new",
      title: "Наушники",
      price: 5000,
      currency: "RUB",
    });

    await press("mv:item-new:list-b");

    expect(prisma.item.updateMany).toHaveBeenCalledWith({
      where: { id: "item-new", userId: "actor-1" },
      data: { listId: "list-b" },
    });
    expect(mockEditTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: "555",
        messageId: 7,
        text: "🎁 Добавлено в «Мечты»\n📌 Наушники\n💰 5000 RUB",
      }),
    );
  });
});
