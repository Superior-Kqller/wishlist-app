import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram/client";
import { getTelegramConfig } from "@/lib/telegram/config";
import type { ItemStatus } from "@/lib/item-status";

interface NotifyStatusTransitionInput {
  itemId: string;
  itemTitle: string;
  ownerUserId: string;
  actorUserId: string;
  previousStatus: ItemStatus;
  nextStatus: ItemStatus;
  previousClaimerUserId: string | null;
  nextClaimerUserId: string | null;
}

interface NotifyItemCreatedInput {
  itemId: string;
  itemTitle: string;
  actorUserId: string;
  actorName: string;
}

function formatEventMessage(title: string, lines: string[]): string {
  return [title, ...lines].join("\n");
}

function formatItemCreatedMessage(input: NotifyItemCreatedInput): string {
  return formatEventMessage("🎁 Новый подарок", [
    `👤 ${input.actorName}`,
    `📌 ${input.itemTitle}`,
  ]);
}

function formatPurchasedMessage(actorName: string, itemTitle: string): string {
  return formatEventMessage("✅ Подарок куплен", [
    `👤 ${actorName}`,
    `📌 ${itemTitle}`,
  ]);
}

async function sendTelegramToUser(userId: string, text: string): Promise<void> {
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

  await sendTelegramMessage({
    chatId: user.telegramId,
    text,
  });
}

async function sendTelegramToConfiguredChats(text: string): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled || config.chatIds.length === 0) return;

  for (const chatId of config.chatIds) {
    try {
      await sendTelegramMessage({ chatId, text });
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

export async function notifyStatusTransition(input: NotifyStatusTransitionInput): Promise<void> {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { id: true, name: true },
    });

    const actorName = actor?.name ?? "Пользователь";

    if (input.nextStatus === "CLAIMED") return;
    if (input.previousStatus === "CLAIMED" && input.nextStatus === "AVAILABLE") return;

    if (input.nextStatus === "PURCHASED") {
      const text = formatPurchasedMessage(actorName, input.itemTitle);
      await sendTelegramToConfiguredChats(text);

      await sendTelegramToUser(input.ownerUserId, text);

      if (input.nextClaimerUserId) {
        await sendTelegramToUser(input.nextClaimerUserId, text);
      }
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

