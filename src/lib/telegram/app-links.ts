import type { TelegramReplyMarkup } from "@/lib/telegram/types";

interface AppLink {
  text: string;
  /** Путь внутри приложения, например `/?item=…`. */
  path: string;
}

/**
 * Ссылки на страницы приложения для сообщения бота. На https-адрес — кнопки, по
 * одной в ряд. Кнопку на непубличный адрес (localhost, http в домашней сети)
 * Telegram отклоняет вместе со всем сообщением, поэтому там ссылки идут строками
 * текста. Без адреса приложения (`NEXTAUTH_URL`) ссылок нет.
 */
export function appLinks(
  links: AppLink[],
  baseUrl: string | undefined = process.env.NEXTAUTH_URL,
): { lines: string[]; replyMarkup?: TelegramReplyMarkup } {
  const base = baseUrl?.trim().replace(/\/+$/, "");
  if (!base || links.length === 0) return { lines: [] };

  const resolved = links.map((link) => ({
    text: link.text,
    url: new URL(link.path, `${base}/`).toString(),
  }));
  if (base.startsWith("https://")) {
    return { lines: [], replyMarkup: { inline_keyboard: resolved.map((link) => [link]) } };
  }
  return { lines: resolved.map((link) => `${link.text}: ${link.url}`) };
}

/** Карточка желания на сайте: `/?item=<id>` открывает её поверх главной. */
export function itemPath(itemId: string): string {
  return `/?item=${encodeURIComponent(itemId)}`;
}
