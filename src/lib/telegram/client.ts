import { getTelegramConfig } from "@/lib/telegram/config";
import type { TelegramParseMode, TelegramReplyMarkup } from "@/lib/telegram/types";

/** Дольше этого ждать ответа Telegram незачем: уведомление не стоит очереди. */
const TELEGRAM_REQUEST_TIMEOUT_MS = 5000;

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
    // Свой срок ожидания: без него зависший Telegram держит вызывающего
    // столько, сколько решит платформенный таймаут, то есть неизвестно сколько.
    signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_MS),
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

/** Правка уже отправленного сообщения ботом: без `replyMarkup` кнопки пропадают. */
export async function editTelegramMessage(input: {
  chatId: string;
  messageId: number;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}): Promise<void> {
  await callTelegramApi("editMessageText", {
    chat_id: input.chatId,
    message_id: input.messageId,
    text: input.text,
    reply_markup: input.replyMarkup ?? { inline_keyboard: [] },
  });
}

/** «печатает…» в шапке чата, пока бот разбирает ссылку. */
export async function sendTelegramTyping(chatId: string): Promise<void> {
  await callTelegramApi("sendChatAction", { chat_id: chatId, action: "typing" });
}

export async function answerTelegramCallback(input: AnswerCallbackInput): Promise<void> {
  const payload: Record<string, unknown> = {
    callback_query_id: input.callbackQueryId,
  };

  if (input.text) payload.text = input.text;
  if (input.showAlert !== undefined) payload.show_alert = input.showAlert;

  await callTelegramApi("answerCallbackQuery", payload);
}

let botUsername: Promise<string> | null = null;

/** Имя бота для ссылок `t.me/<bot>`: спрашиваем у Telegram один раз, а не держим в .env. */
export function getTelegramBotUsername(): Promise<string> {
  botUsername ??= callTelegramApi<{ username: string }>("getMe", {}).then(
    (me) => me.username,
    (error: unknown) => {
      botUsername = null;
      throw error;
    },
  );
  return botUsername;
}

/** Адрес вебхука или пустая строка: без него бот не получит `/start` и привязка не пройдёт. */
export async function getTelegramWebhookUrl(): Promise<string> {
  const info = await callTelegramApi<{ url: string }>("getWebhookInfo", {});
  return info.url;
}
