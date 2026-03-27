export type TelegramLinkStatus = "not_configured" | "pending" | "linked";

export function inferTelegramLinkStatus(input: {
  telegramId: string | null;
  telegramConfirmedAt: Date | null;
}): TelegramLinkStatus {
  if (!input.telegramId) return "not_configured";
  if (!input.telegramConfirmedAt) return "pending";
  return "linked";
}
