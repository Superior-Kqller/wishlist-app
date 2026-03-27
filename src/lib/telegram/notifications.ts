import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram/client";
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

export async function notifyStatusTransition(input: NotifyStatusTransitionInput): Promise<void> {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { id: true, name: true },
    });

    const actorName = actor?.name ?? "Пользователь";

    if (input.nextStatus === "CLAIMED") {
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
      if (input.previousClaimerUserId) {
        await sendTelegramToUser(
          input.previousClaimerUserId,
          `Бронь снята: ${input.itemTitle}`
        );
      }
      return;
    }

    if (input.nextStatus === "PURCHASED") {
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

