import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { getTelegramConfig } from "@/lib/telegram/config";
import type { ItemStatus } from "@/lib/item-status";
import { appLinks, itemPath } from "@/lib/telegram/app-links";
import type { TelegramReplyMarkup } from "@/lib/telegram/types";

interface TelegramNotice {
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}

interface NotifyStatusTransitionInput {
  itemId: string;
  itemTitle: string;
  ownerUserId: string;
  actorUserId: string;
  nextStatus: ItemStatus;
}

interface NotifyItemCreatedInput {
  itemId: string;
  itemTitle: string;
  actorUserId: string;
  actorName: string;
}

interface NotifyCommentCreatedInput {
  itemId: string;
  itemTitle: string;
  actorUserId: string;
  actorName: string;
  commentText: string;
  recipientUserIds: string[];
}

/** Событие о желании: заголовок, строки и ссылка «Открыть желание». */
function formatEventMessage(title: string, lines: string[], itemId: string): TelegramNotice {
  const links = appLinks([{ text: "Открыть желание", path: itemPath(itemId) }]);
  return { text: [title, ...lines, ...links.lines].join("\n"), replyMarkup: links.replyMarkup };
}

function formatItemCreatedMessage(input: NotifyItemCreatedInput): TelegramNotice {
  return formatEventMessage(
    "🎁 Новый подарок",
    [`👤 ${input.actorName}`, `📌 ${input.itemTitle}`],
    input.itemId,
  );
}

function formatPurchasedMessage(
  actorName: string,
  itemTitle: string,
  itemId: string,
): TelegramNotice {
  return formatEventMessage("✅ Подарок куплен", [`👤 ${actorName}`, `📌 ${itemTitle}`], itemId);
}

function formatCommentCreatedMessage(input: NotifyCommentCreatedInput): TelegramNotice {
  const text =
    input.commentText.length > 240
      ? `${input.commentText.slice(0, 237).trimEnd()}…`
      : input.commentText;

  return formatEventMessage(
    "💬 Новый комментарий",
    [`👤 ${input.actorName}`, `📌 ${input.itemTitle}`, `💭 ${text}`],
    input.itemId,
  );
}

async function sendTelegramToUser(userId: string, notice: TelegramNotice): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramId: true,
      telegramConfirmedAt: true,
      telegramNotificationsEnabled: true,
    },
  });

  if (!user?.telegramId || !user.telegramConfirmedAt || !user.telegramNotificationsEnabled) {
    return;
  }

  await sendTelegramMessage({ chatId: user.telegramId, ...notice });
}

async function sendTelegramToConfiguredChats(notice: TelegramNotice): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || config.chatIds.length === 0) return;

  for (const chatId of config.chatIds) {
    try {
      await sendTelegramMessage({ chatId, ...notice });
    } catch (error) {
      sanitizeError("Telegram configured chat notification send error", error, { chatId });
    }
  }
}

export async function notifyItemCreated(input: NotifyItemCreatedInput): Promise<void> {
  try {
    await sendTelegramToConfiguredChats(formatItemCreatedMessage(input));
  } catch (error) {
    sanitizeError("Telegram item created notification send error", error, {
      itemId: input.itemId,
      actorUserId: input.actorUserId,
    });
  }
}

export async function notifyCommentCreated(input: NotifyCommentCreatedInput): Promise<void> {
  try {
    const notice = formatCommentCreatedMessage(input);
    const recipientUserIds = [...new Set(input.recipientUserIds)].filter(
      (userId) => userId !== input.actorUserId,
    );

    await Promise.allSettled(recipientUserIds.map((userId) => sendTelegramToUser(userId, notice)));
  } catch (error) {
    sanitizeError("Telegram comment notification send error", error, {
      itemId: input.itemId,
      actorUserId: input.actorUserId,
    });
  }
}

export async function notifyStatusTransition(input: NotifyStatusTransitionInput): Promise<void> {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { id: true, name: true },
    });

    const actorName = actor?.name ?? "Пользователь";

    if (input.nextStatus === "PURCHASED") {
      const notice = formatPurchasedMessage(actorName, input.itemTitle, input.itemId);
      await sendTelegramToConfiguredChats(notice);

      await sendTelegramToUser(input.ownerUserId, notice);
    }
  } catch (error) {
    sanitizeError("Telegram notification send error", error, {
      itemId: input.itemId,
      ownerUserId: input.ownerUserId,
      actorUserId: input.actorUserId,
      nextStatus: input.nextStatus,
    });
  }
}
