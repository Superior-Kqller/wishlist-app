import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

function hashLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Одноразовый токен для ссылки `t.me/<bot>?start=<токен>`. В базе — только хеш;
 * новый токен заменяет прежний. 32 символа base64url укладываются в лимит
 * Telegram для `start` (64 символа `A-Za-z0-9_-`).
 */
export async function createTelegramLinkToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramLinkTokenHash: hashLinkToken(token),
      telegramLinkTokenExpiresAt: new Date(Date.now() + LINK_TOKEN_TTL_MS),
    },
  });
  return token;
}

/**
 * Привязка по токену из ссылки: Telegram сам сообщает `from.id`, вводить ID руками
 * не нужно. Чужую подтверждённую привязку не перехватываем — иначе по присланной
 * злоумышленником ссылке жертва отдала бы ему свой Telegram. Неподтверждённую
 * (введённую когда-то вручную, возможно с опечаткой) снимаем.
 */
export async function confirmTelegramLinkByToken(params: {
  token: string;
  telegramId: string;
  telegramUsername?: string;
}): Promise<{ ok: true; userName: string } | { ok: false; reason: "invalid_token" | "taken" }> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { telegramLinkTokenHash: hashLinkToken(params.token) },
      select: { id: true, name: true, telegramLinkTokenExpiresAt: true },
    });
    if (!user?.telegramLinkTokenExpiresAt || user.telegramLinkTokenExpiresAt < new Date()) {
      return { ok: false, reason: "invalid_token" } as const;
    }

    const holder = await tx.user.findUnique({
      where: { telegramId: params.telegramId },
      select: { id: true, telegramConfirmedAt: true },
    });
    if (holder && holder.id !== user.id) {
      if (holder.telegramConfirmedAt) return { ok: false, reason: "taken" } as const;
      await tx.user.update({
        where: { id: holder.id },
        data: { telegramId: null, telegramLinkedAt: null },
      });
    }

    const now = new Date();
    await tx.user.update({
      where: { id: user.id },
      data: {
        telegramId: params.telegramId,
        telegramUsername: params.telegramUsername ?? null,
        telegramLinkedAt: now,
        telegramConfirmedAt: now,
        telegramNotificationsEnabled: true,
        telegramLinkTokenHash: null,
        telegramLinkTokenExpiresAt: null,
      },
    });
    return { ok: true, userName: user.name } as const;
  });
}
