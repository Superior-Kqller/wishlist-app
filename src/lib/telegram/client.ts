import { getTelegramConfig } from "@/lib/telegram/config";
import type { TelegramParseMode, TelegramReplyMarkup } from "@/lib/telegram/types";

interface SendMessageInput {
  chatId: string;
  text: string;
  parseMode?: TelegramParseMode;
  replyMarkup?: TelegramReplyMarkup;
}

interface AnswerCallbackInput {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  description?: string;
  result?: T;
}

async function callTelegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const config = getTelegramConfig();
  if (!config.enabled) {
    throw new Error("Telegram integration is not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !json.ok || !json.result) {
    const reason = json.description ?? `HTTP ${response.status}`;
    throw new Error(`Telegram API ${method} failed: ${reason}`);
  }

  return json.result;
}

export async function sendTelegramMessage(input: SendMessageInput): Promise<void> {
  const payload: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text,
  };

  if (input.parseMode) {
    payload.parse_mode = input.parseMode;
  }

  if (input.replyMarkup) {
    payload.reply_markup = input.replyMarkup;
  }

  await callTelegramApi("sendMessage", payload);
}

export async function answerTelegramCallback(input: AnswerCallbackInput): Promise<void> {
  const payload: Record<string, unknown> = {
    callback_query_id: input.callbackQueryId,
  };

  if (input.text) payload.text = input.text;
  if (input.showAlert !== undefined) payload.show_alert = input.showAlert;

  await callTelegramApi("answerCallbackQuery", payload);
}

