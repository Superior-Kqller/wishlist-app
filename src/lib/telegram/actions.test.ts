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
});
