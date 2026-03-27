export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  webhookSecret?: string;
}

export function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  return {
    enabled: botToken.length > 0,
    botToken,
    webhookSecret: webhookSecret && webhookSecret.length > 0 ? webhookSecret : undefined,
  };
}

