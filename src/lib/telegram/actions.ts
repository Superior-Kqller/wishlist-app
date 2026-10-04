import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/logger";
import { canTransitionStatus, type ItemStatus } from "@/lib/item-status";
import { answerTelegramCallback, sendTelegramMessage } from "@/lib/telegram/client";
import { confirmTelegramLinkByToken } from "@/lib/telegram/linking";
import {
  findMessageLink,
  handleAddLink,
  handleAddedItemCallback,
} from "@/lib/telegram/add-by-link";
import type { TelegramCallbackQuery, TelegramMessage, TelegramUpdate } from "@/lib/telegram/types";
import { notifyStatusTransition } from "@/lib/telegram/notifications";

function toTelegramIdString(id: number): string {
  return String(id);
}

async function getActorByTelegramId(telegramId: string) {
  return prisma.user.findFirst({
    where: {
      telegramId,
      telegramConfirmedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      telegramId: true,
      telegramConfirmedAt: true,
      telegramNotificationsEnabled: true,
    },
  });
}

async function sendMainMenu(chatId: string, text: string): Promise<void> {
  await sendTelegramMessage({
    chatId,
    text,
    replyMarkup: { inline_keyboard: [[{ text: "Мои подарки", callback_data: "menu:mine" }]] },
  });
}

const PRIVATE_CHAT_ONLY_MESSAGE = "Команда доступна только в личном чате.";

function formatMyItems(items: Array<{ id: string; title: string; status: ItemStatus }>): string {
  if (items.length === 0) {
    return "У вас пока нет подарков.";
  }

  const lines = items.map((item) => `- ${item.title} [${item.status}]`);
  return ["Ваши подарки:", ...lines].join("\n");
}

function formatAvailableItems(
  items: Array<{
    id: string;
    title: string;
    ownerName: string;
    price: number | null;
    currency: string;
  }>,
): string {
  if (items.length === 0) {
    return "Сейчас нет доступных подарков.";
  }

  const lines = items.map((item) => {
    const price = item.price === null ? "без цены" : `${item.price} ${item.currency}`;
    return `- ${item.title} (${item.ownerName}, ${price})`;
  });

  return ["Доступные подарки:", ...lines].join("\n");
}

function buildMyItemsMarkup(
  items: Array<{ id: string; title: string; status: ItemStatus; ownerUserId: string }>,
  actorUserId: string,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  for (const item of items) {
    if (item.ownerUserId === actorUserId && item.status !== "PURCHASED") {
      rows.push([{ text: `Отметить куплено: ${item.title}`, callback_data: `bought:${item.id}` }]);
    }
  }

  if (rows.length === 0) {
    rows.push([{ text: "Обновить список", callback_data: "menu:mine" }]);
  }

  return { inline_keyboard: rows };
}

async function handleStart(message: TelegramMessage, token: string | undefined): Promise<void> {
  const from = message.from;
  if (!from) return;

  const telegramId = toTelegramIdString(from.id);
  const chatId = String(message.chat.id);

  // Ссылка из настроек: `t.me/<bot>?start=<токен>`. Уведомления идут на from.id,
  // а это адрес только личного чата — в группе токен не принимаем.
  if (token) {
    if (message.chat.type !== "private") {
      await sendTelegramMessage({ chatId, text: PRIVATE_CHAT_ONLY_MESSAGE });
      return;
    }

    const linked = await confirmTelegramLinkByToken({
      token,
      telegramId,
      telegramUsername: from.username,
    });
    if (!linked.ok) {
      await sendTelegramMessage({
        chatId,
        text:
          linked.reason === "taken"
            ? "Этот Telegram уже подключён к другому аккаунту вишлиста. Сначала отключите его там."
            : "Ссылка устарела или уже использована. Получите новую в настройках вишлиста.",
      });
      return;
    }

    await sendMainMenu(
      chatId,
      `Telegram подключен к аккаунту ${linked.userName}. Пришлите ссылку на товар — добавлю её в желания.`,
    );
    return;
  }

  // Голый `/start` больше ничего не привязывает: подтверждение введённого
  // вручную ID отдало бы Telegram тому, кто вписал чужой номер.
  if (await getActorByTelegramId(telegramId)) {
    await sendMainMenu(
      chatId,
      "Telegram уже подключён. Используйте кнопки меню для работы с подарками.",
    );
    return;
  }

  await sendTelegramMessage({
    chatId,
    text: "Telegram не подключён. Откройте настройки вишлиста и нажмите «Подключить Telegram».",
  });
}

async function handleMyItems(actorUserId: string, chatId: string): Promise<void> {
  const items = await prisma.item.findMany({
    where: { userId: actorUserId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      userId: true,
    },
  });

  await sendTelegramMessage({
    chatId,
    text: formatMyItems(items),
    replyMarkup: buildMyItemsMarkup(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        ownerUserId: item.userId,
      })),
      actorUserId,
    ),
  });
}

async function handleAvailableItems(actorUserId: string, chatId: string): Promise<void> {
  const visibleItems = await prisma.item.findMany({
    where: {
      status: "AVAILABLE",
      list: {
        OR: [{ userId: actorUserId }, { viewers: { some: { userId: actorUserId } } }],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      list: { select: { userId: true, user: { select: { name: true } } } },
    },
  });

  const items = visibleItems
    .filter((item) => item.list?.userId && item.list.userId !== actorUserId)
    .map((item) => ({
      id: item.id,
      title: item.title,
      ownerName: item.list?.user.name ?? "Пользователь",
      price: item.price,
      currency: item.currency,
    }));

  await sendTelegramMessage({
    chatId,
    text: formatAvailableItems(items),
  });
}

async function transitionItemStatusViaTelegram(params: {
  actorUserId: string;
  itemId: string;
  nextStatus: ItemStatus;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const existing = await prisma.item.findUnique({
    where: { id: params.itemId },
    select: {
      id: true,
      title: true,
      status: true,
      userId: true,
      list: {
        select: {
          userId: true,
          viewers: { select: { userId: true } },
        },
      },
    },
  });

  if (!existing || !existing.list) {
    return { ok: false, message: "Товар не найден" };
  }

  const isVisible =
    existing.list.userId === params.actorUserId ||
    existing.list.viewers.some((viewer) => viewer.userId === params.actorUserId);
  if (!isVisible) {
    return { ok: false, message: "Нет доступа к товару" };
  }

  if (
    !canTransitionStatus(existing.status, params.nextStatus, {
      actorUserId: params.actorUserId,
      ownerUserId: existing.userId,
    })
  ) {
    return { ok: false, message: "Недопустимый переход статуса" };
  }

  const now = new Date();
  const updateData: {
    status: ItemStatus;
    purchased?: boolean;
    purchasedAt?: Date | null;
  } = {
    status: params.nextStatus,
  };

  if (params.nextStatus === "PURCHASED") {
    updateData.purchased = true;
    updateData.purchasedAt = now;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.item.updateMany({
      where: {
        id: params.itemId,
        status: existing.status,
      },
      data: updateData,
    });

    if (result.count !== 1) return null;

    return tx.item.findUnique({
      where: { id: params.itemId },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
      },
    });
  });

  if (!updated) {
    return { ok: false, message: "Состояние товара уже изменилось, обновите список" };
  }

  await notifyStatusTransition({
    itemId: updated.id,
    itemTitle: updated.title,
    ownerUserId: updated.userId,
    actorUserId: params.actorUserId,
    nextStatus: updated.status,
  });

  return { ok: true, message: "Подарок отмечен купленным" };
}

async function handleCallback(actorUserId: string, callback: TelegramCallbackQuery): Promise<void> {
  const data = callback.data ?? "";
  const chatId = callback.message?.chat?.id ? String(callback.message.chat.id) : null;

  if (data === "menu:mine") {
    if (callback.message && callback.message.chat.type !== "private") {
      await answerTelegramCallback({
        callbackQueryId: callback.id,
        text: PRIVATE_CHAT_ONLY_MESSAGE,
        showAlert: true,
      });
      return;
    }

    if (chatId) {
      await handleMyItems(actorUserId, chatId);
    }
    await answerTelegramCallback({ callbackQueryId: callback.id });
    return;
  }

  if (data === "menu:available") {
    if (callback.message && callback.message.chat.type !== "private") {
      await answerTelegramCallback({
        callbackQueryId: callback.id,
        text: PRIVATE_CHAT_ONLY_MESSAGE,
        showAlert: true,
      });
      return;
    }

    if (chatId) {
      await handleAvailableItems(actorUserId, chatId);
    }
    await answerTelegramCallback({ callbackQueryId: callback.id });
    return;
  }

  const [action, itemId, listId] = data.split(":");
  if (!itemId) {
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: "Неизвестная команда",
      showAlert: true,
    });
    return;
  }

  if (action === "rm" || action === "mv") {
    await handleAddedItemCallback(actorUserId, callback, action, itemId, listId);
    return;
  }

  const nextStatus: Record<string, ItemStatus> = {
    bought: "PURCHASED",
  };

  const status = nextStatus[action];
  if (!status) {
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: "Неизвестное действие",
      showAlert: true,
    });
    return;
  }

  const result = await transitionItemStatusViaTelegram({
    actorUserId,
    itemId,
    nextStatus: status,
  });

  await answerTelegramCallback({
    callbackQueryId: callback.id,
    text: result.message,
    showAlert: !result.ok,
  });

  if (result.ok && chatId) {
    await handleMyItems(actorUserId, chatId);
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim();
  if (!text) return;

  if (text === "/chatid" || text.startsWith("/chatid@")) {
    await sendTelegramMessage({
      chatId: String(message.chat.id),
      text: `Chat ID этого чата: ${message.chat.id}`,
    });
    return;
  }

  const start = text.match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/);
  if (start) {
    await handleStart(message, start[1]);
    return;
  }

  const from = message.from;
  if (!from) return;

  const actor = await getActorByTelegramId(toTelegramIdString(from.id));
  if (!actor) {
    await sendTelegramMessage({
      chatId: String(message.chat.id),
      text: "Сначала подключите Telegram в настройках вишлиста.",
    });
    return;
  }

  // Ссылка на товар — новое желание. Только в личном чате: иначе любая ссылка,
  // брошенная в семейный чат, попала бы в вишлист отправителя.
  const link = text.startsWith("/") ? null : findMessageLink(message);
  if (link) {
    if (message.chat.type === "private") {
      await handleAddLink(actor.id, String(message.chat.id), link);
    }
    return;
  }

  if (text === "/myitems") {
    if (message.chat.type !== "private") {
      await sendTelegramMessage({
        chatId: String(message.chat.id),
        text: PRIVATE_CHAT_ONLY_MESSAGE,
      });
      return;
    }

    await handleMyItems(actor.id, String(message.chat.id));
    return;
  }

  if (text === "/available") {
    if (message.chat.type !== "private") {
      await sendTelegramMessage({
        chatId: String(message.chat.id),
        text: PRIVATE_CHAT_ONLY_MESSAGE,
      });
      return;
    }

    await handleAvailableItems(actor.id, String(message.chat.id));
    return;
  }

  await sendMainMenu(
    String(message.chat.id),
    message.chat.type === "private"
      ? "Пришлите ссылку на товар — добавлю её в желания. Ещё есть /myitems, /available и кнопки меню."
      : "Команда не распознана. Используйте /myitems, /available или кнопки меню.",
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  try {
    if (update.message) {
      await handleMessage(update.message);
      return;
    }

    if (update.callback_query) {
      const actor = await getActorByTelegramId(toTelegramIdString(update.callback_query.from.id));
      if (!actor) {
        await answerTelegramCallback({
          callbackQueryId: update.callback_query.id,
          text: "Сначала подключите Telegram в настройках вишлиста.",
          showAlert: true,
        });
        return;
      }

      await handleCallback(actor.id, update.callback_query);
    }
  } catch (error) {
    sanitizeError("Telegram update handling error", error, { updateId: update.update_id });
  }
}
