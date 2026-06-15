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
    await sendTelegramToConfiguredChats(
      `${input.actorName} добавил(а) товар в вишлист: ${input.itemTitle}`
    );
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

    if (input.nextStatus === "CLAIMED") {
      await sendTelegramToConfiguredChats(
        `${actorName} забронировал(а) подарок: ${input.itemTitle}`
      );

      await sendTelegramToUser(
        input.ownerUserId,
        `${actorName} забронировал(а) подарок: ${input.itemTitle}`
      );

      if (input.nextClaimerUserId) {
        await sendTelegramToUser(
          input.nextClaimerUserId,
          `Вы забронировали подарок: ${input.itemTitle}`
        );
      }
      return;
    }

    if (input.previousStatus === "CLAIMED" && input.nextStatus === "AVAILABLE") {
      await sendTelegramToConfiguredChats(`Бронь снята: ${input.itemTitle}`);

      if (input.previousClaimerUserId) {
        await sendTelegramToUser(
          input.previousClaimerUserId,
          `Бронь снята: ${input.itemTitle}`
        );
      }
      return;
    }

    if (input.nextStatus === "PURCHASED") {
      await sendTelegramToConfiguredChats(`Подарок отмечен купленным: ${input.itemTitle}`);

      await sendTelegramToUser(
        input.ownerUserId,
        `Подарок отмечен купленным: ${input.itemTitle}`
      );

      if (input.nextClaimerUserId) {
        await sendTelegramToUser(
          input.nextClaimerUserId,
          `Покупка подтверждена: ${input.itemTitle}`
        );
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

