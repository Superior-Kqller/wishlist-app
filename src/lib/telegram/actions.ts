import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/logger";
import { canViewList, canClaimItem, canUnclaimItem } from "@/lib/access-policy";
import { canTransitionStatus, type ItemStatus } from "@/lib/item-status";
import { answerTelegramCallback, sendTelegramMessage } from "@/lib/telegram/client";
import {
  buildMainMenuMarkup,
  formatAlreadyLinkedMessage,
  formatLinkedMessage,
  formatPendingLinkMessage,
} from "@/lib/telegram/formatters";
import { confirmTelegramLinkByTelegramId } from "@/lib/telegram/linking";
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
    replyMarkup: buildMainMenuMarkup(),
  });
}

function formatMyItems(items: Array<{ id: string; title: string; status: ItemStatus }>): string {
  if (items.length === 0) {
    return "У вас пока нет подарков.";
  }

  const lines = items.map((item) => `- ${item.title} [${item.status}]`);
  return ["Ваши подарки:", ...lines].join("\n");
}

function formatAvailableItems(
  items: Array<{ id: string; title: string; ownerName: string; price: number | null; currency: string }>
): string {
  if (items.length === 0) {
    return "Сейчас нет доступных подарков для бронирования.";
  }

  const lines = items.map((item) => {
    const price = item.price === null ? "без цены" : `${item.price} ${item.currency}`;
    return `- ${item.title} (${item.ownerName}, ${price})`;
  });

  return ["Доступные подарки:", ...lines].join("\n");
}

function buildAvailableItemsMarkup(
  items: Array<{ id: string; title: string }>
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  return {
    inline_keyboard: items.map((item) => [
      {
        text: `Забронировать: ${item.title}`,
        callback_data: `claim:${item.id}`,
      },
    ]),
  };
}

function buildMyItemsMarkup(
  items: Array<{ id: string; title: string; status: ItemStatus; claimedByUserId: string | null; ownerUserId: string }>,
  actorUserId: string
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  for (const item of items) {
    if (item.status === "CLAIMED") {
      if (item.claimedByUserId === actorUserId || item.ownerUserId === actorUserId) {
        rows.push([{ text: `Снять бронь: ${item.title}`, callback_data: `unclaim:${item.id}` }]);
      }
      if (item.claimedByUserId === actorUserId || item.ownerUserId === actorUserId) {
        rows.push([{ text: `Отметить куплено: ${item.title}`, callback_data: `bought:${item.id}` }]);
      }
    }
  }

  if (rows.length === 0) {
    rows.push([{ text: "Обновить список", callback_data: "menu:mine" }]);
  }

  return { inline_keyboard: rows };
}

async function handleStart(message: TelegramMessage): Promise<void> {
  const from = message.from;
  if (!from) return;

  const telegramId = toTelegramIdString(from.id);
  const result = await confirmTelegramLinkByTelegramId({
    telegramId,
    telegramUsername: from.username,
  });

  if (!result.ok) {
    if (result.reason === "already_linked") {
      await sendMainMenu(String(message.chat.id), formatAlreadyLinkedMessage());
      return;
    }

    await sendTelegramMessage({
      chatId: String(message.chat.id),
      text: formatPendingLinkMessage(),
    });
    return;
  }

  await sendMainMenu(String(message.chat.id), formatLinkedMessage(result.userName));
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
      claimedByUserId: true,
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
        claimedByUserId: item.claimedByUserId,
        ownerUserId: item.userId,
      })),
      actorUserId
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
    replyMarkup: buildAvailableItemsMarkup(items.map((item) => ({ id: item.id, title: item.title }))),
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
      claimedByUserId: true,
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

  const isVisible = canViewList({
    ownerUserId: existing.list.userId,
    viewerUserIds: existing.list.viewers.map((viewer) => viewer.userId),
    actorUserId: params.actorUserId,
  });
  if (!isVisible) {
    return { ok: false, message: "Нет доступа к товару" };
  }

  if (
    params.nextStatus === "CLAIMED" &&
    !canClaimItem({
      actorUserId: params.actorUserId,
      ownerUserId: existing.userId,
      claimerUserId: existing.claimedByUserId,
      isVisibleToActor: true,
      status: existing.status,
    })
  ) {
    return { ok: false, message: "Нельзя забронировать этот товар" };
  }

  if (
    params.nextStatus === "AVAILABLE" &&
    !canUnclaimItem({
      actorUserId: params.actorUserId,
      ownerUserId: existing.userId,
      claimerUserId: existing.claimedByUserId,
      isVisibleToActor: true,
      status: existing.status,
    })
  ) {
    return { ok: false, message: "Нельзя снять эту бронь" };
  }

  if (
    !canTransitionStatus(existing.status, params.nextStatus, {
      actorUserId: params.actorUserId,
      ownerUserId: existing.userId,
      claimerUserId: existing.claimedByUserId,
    })
  ) {
    return { ok: false, message: "Недопустимый переход статуса" };
  }

  const now = new Date();
  const updateData: {
    status: ItemStatus;
    claimedByUserId?: string | null;
    claimedAt?: Date | null;
    purchased?: boolean;
    purchasedAt?: Date | null;
  } = {
    status: params.nextStatus,
  };

  if (params.nextStatus === "CLAIMED") {
    updateData.claimedByUserId = params.actorUserId;
    updateData.claimedAt = now;
    updateData.purchased = false;
    updateData.purchasedAt = null;
  } else if (params.nextStatus === "AVAILABLE") {
    updateData.claimedByUserId = null;
    updateData.claimedAt = null;
    updateData.purchased = false;
    updateData.purchasedAt = null;
  } else if (params.nextStatus === "PURCHASED") {
    updateData.purchased = true;
    updateData.purchasedAt = now;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.item.updateMany({
      where: {
        id: params.itemId,
        status: existing.status,
        claimedByUserId: existing.status === "CLAIMED" ? existing.claimedByUserId : existing.claimedByUserId,
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
        claimedByUserId: true,
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
    previousStatus: existing.status,
    nextStatus: updated.status,
    previousClaimerUserId: existing.claimedByUserId,
    nextClaimerUserId: updated.claimedByUserId,
  });

  if (params.nextStatus === "CLAIMED") {
    return { ok: true, message: "Подарок успешно забронирован" };
  }
  if (params.nextStatus === "AVAILABLE") {
    return { ok: true, message: "Бронь снята" };
  }
  return { ok: true, message: "Подарок отмечен купленным" };
}

async function handleCallback(actorUserId: string, callback: TelegramCallbackQuery): Promise<void> {
  const data = callback.data ?? "";
  const chatId = callback.message?.chat?.id ? String(callback.message.chat.id) : null;

  if (data === "menu:mine") {
    if (chatId) {
      await handleMyItems(actorUserId, chatId);
    }
    await answerTelegramCallback({ callbackQueryId: callback.id });
    return;
  }

  if (data === "menu:available") {
    if (chatId) {
      await handleAvailableItems(actorUserId, chatId);
    }
    await answerTelegramCallback({ callbackQueryId: callback.id });
    return;
  }

  const [action, itemId] = data.split(":");
  if (!itemId) {
    await answerTelegramCallback({ callbackQueryId: callback.id, text: "Неизвестная команда", showAlert: true });
    return;
  }

  const nextStatus: Record<string, ItemStatus> = {
    claim: "CLAIMED",
    unclaim: "AVAILABLE",
    bought: "PURCHASED",
  };

  const status = nextStatus[action];
  if (!status) {
    await answerTelegramCallback({ callbackQueryId: callback.id, text: "Неизвестное действие", showAlert: true });
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
    if (status === "CLAIMED") {
      await handleAvailableItems(actorUserId, chatId);
    } else {
      await handleMyItems(actorUserId, chatId);
    }
  }
}

async function handleMessage(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim();
  if (!text) return;

  if (text === "/start") {
    await handleStart(message);
    return;
  }

  const from = message.from;
  if (!from) return;

  const actor = await getActorByTelegramId(toTelegramIdString(from.id));
  if (!actor) {
    await sendTelegramMessage({
      chatId: String(message.chat.id),
      text: "Сначала привяжите Telegram в настройках аккаунта wishlist и отправьте /start.",
    });
    return;
  }

  if (text === "/myitems") {
    await handleMyItems(actor.id, String(message.chat.id));
    return;
  }

  if (text === "/available") {
    await handleAvailableItems(actor.id, String(message.chat.id));
    return;
  }

  await sendMainMenu(String(message.chat.id), "Команда не распознана. Используйте /myitems, /available или кнопки меню.");
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
          text: "Нужно подтвердить привязку через /start",
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

