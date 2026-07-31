export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatIds: string[];
  webhookSecret?: string;
}

function parseTelegramIdList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  return {
    enabled: botToken.length > 0,
    botToken,
    chatIds: parseTelegramIdList(process.env.TELEGRAM_CHAT_IDS),
    webhookSecret: webhookSecret && webhookSecret.length > 0 ? webhookSecret : undefined,
  };
}
