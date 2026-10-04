import { setTimeout as sleep } from "node:timers/promises";
import { getTelegramConfig } from "@/lib/telegram/config";
import { sanitizeError, sanitizeLog } from "@/lib/logger";
import type { TelegramParseMode, TelegramReplyMarkup, TelegramUpdate } from "@/lib/telegram/types";

export interface TelegramInlineArticle {
  type: "article";
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  input_message_content: { message_text: string };
  reply_markup?: TelegramReplyMarkup;
}

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

async function callTelegramApi<T>(
  method: string,
  payload: Record<string, unknown>,
  timeoutMs = TELEGRAM_REQUEST_TIMEOUT_MS,
): Promise<T> {
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
    signal: AbortSignal.timeout(timeoutMs),
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

/**
 * Ответ на `@бот …`. Список у каждого свой: без `is_personal` Telegram отдал бы
 * закэшированные желания одного человека другому, набравшему тот же запрос.
 * Кэш короткий, чтобы только что добавленное желание появлялось сразу.
 */
export async function answerTelegramInlineQuery(input: {
  inlineQueryId: string;
  results: TelegramInlineArticle[];
  button?: { text: string; start_parameter: string };
}): Promise<void> {
  await callTelegramApi("answerInlineQuery", {
    inline_query_id: input.inlineQueryId,
    results: input.results,
    is_personal: true,
    cache_time: 5,
    ...(input.button ? { button: input.button } : {}),
  });
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

// Подарки — только в личном чате (в группе бот на них отказывает), ID чата — в группах.
const BOT_COMMANDS = [
  {
    scope: { type: "all_private_chats" },
    commands: [
      { command: "myitems", description: "Мои подарки" },
      { command: "available", description: "Доступные подарки" },
    ],
  },
  {
    scope: { type: "all_group_chats" },
    commands: [{ command: "chatid", description: "ID этого чата" }],
  },
];

const ALLOWED_UPDATES = ["message", "callback_query", "inline_query"];
/** Сколько Telegram держит запрос getUpdates открытым, если обновлений нет. */
const POLL_TIMEOUT_S = 50;
const POLL_RETRY_MS = 5000;

/**
 * Режим по умолчанию: приложение само забирает обновления долгим запросом getUpdates.
 * Входящие соединения не нужны — бот работает за NAT, без https и там, где провайдер
 * режет входящие от Telegram. Один процесс на токен: второй получит 409 Conflict.
 * Не бросает — запущен без ожидания, и ошибка уронила бы весь сервер.
 */
export async function pollTelegramUpdates(
  onUpdate: (update: TelegramUpdate) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  let webhookCleared = false;
  // С нуля: неподтверждённые обновления, накопленные до старта, тоже придут.
  let offset = 0;

  while (!signal?.aborted) {
    try {
      // Пока стоит вебхук, getUpdates отвечает 409. Очередь обновлений не сбрасываем.
      if (!webhookCleared) {
        await callTelegramApi("deleteWebhook", {});
        webhookCleared = true;
      }

      const updates = await callTelegramApi<TelegramUpdate[]>(
        "getUpdates",
        { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ALLOWED_UPDATES },
        (POLL_TIMEOUT_S + 10) * 1000,
      );
      for (const update of updates) {
        offset = update.update_id + 1;
        // Не ждём: разбор ссылки идёт десятки секунд, а inline-список нужен за секунды.
        void onUpdate(update).catch((error: unknown) =>
          sanitizeError("Telegram update handling error", error),
        );
      }
    } catch (error) {
      sanitizeError("Telegram polling error", error);
      await sleep(POLL_RETRY_MS, undefined, { signal }).catch(() => undefined);
    }
  }
}

/**
 * Запуск бота вместе с приложением: меню команд и приём обновлений. Без секрета —
 * опрос getUpdates; с секретом — вебхук на `<publicBaseUrl>/api/integrations/telegram/webhook`,
 * если адрес https. Не бросает: старт приложения от Telegram не зависит.
 */
export async function startTelegramBot(
  publicBaseUrl: string | undefined,
  onUpdate: (update: TelegramUpdate) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const config = getTelegramConfig();
  if (!config.enabled) return;

  try {
    for (const menu of BOT_COMMANDS) {
      await callTelegramApi("setMyCommands", menu);
    }
  } catch (error) {
    sanitizeError("Telegram bot commands setup error", error);
  }

  if (!config.webhookSecret) {
    sanitizeLog("Telegram: обновления забираются опросом getUpdates");
    return pollTelegramUpdates(onUpdate, signal);
  }

  const base = publicBaseUrl?.trim().replace(/\/+$/, "");
  if (!base?.startsWith("https://")) {
    sanitizeLog(
      "Telegram: задан TELEGRAM_WEBHOOK_SECRET, но NEXTAUTH_URL не https — вебхук не поставлен. Уберите секрет, чтобы бот забирал обновления сам.",
    );
    return;
  }

  const url = `${base}/api/integrations/telegram/webhook`;
  try {
    await callTelegramApi("setWebhook", {
      url,
      secret_token: config.webhookSecret,
      allowed_updates: ALLOWED_UPDATES,
    });
    sanitizeLog("Telegram: вебхук", { url });
  } catch (error) {
    sanitizeError("Telegram webhook setup error", error);
  }
}
