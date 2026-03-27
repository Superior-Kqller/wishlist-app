import { prisma } from "@/lib/prisma";

export async function confirmTelegramLinkByTelegramId(params: {
  telegramId: string;
  telegramUsername?: string;
}): Promise<{ ok: true; userId: string; userName: string } | { ok: false; reason: "not_found" | "already_linked" }> {
  const existing = await prisma.user.findFirst({
    where: { telegramId: params.telegramId },
    select: {
      id: true,
      name: true,
      telegramConfirmedAt: true,
    },
  });

  if (!existing) {
    return { ok: false, reason: "not_found" };
  }

  if (existing.telegramConfirmedAt) {
    return { ok: false, reason: "already_linked" };
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      telegramConfirmedAt: new Date(),
      telegramLinkedAt: new Date(),
      telegramUsername: params.telegramUsername ?? null,
    },
  });

  return {
    ok: true,
    userId: existing.id,
    userName: existing.name,
  };
}
