interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  /** Ссылки в тексте: `url` — видимый адрес, `text_link` — адрес под словом. */
  entities?: TelegramMessageEntity[];
}

interface TelegramMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

/** Набор `@бот …` в поле ввода любого чата. */
export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
}

export type TelegramParseMode = "MarkdownV2" | "HTML";

type TelegramInlineButton = { text: string; callback_data: string } | { text: string; url: string };

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineButton[][];
}
