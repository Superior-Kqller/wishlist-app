import type { TelegramReplyMarkup } from "@/lib/telegram/types";

export function buildMainMenuMarkup(): TelegramReplyMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Мои подарки", callback_data: "menu:mine" },
        { text: "Доступные", callback_data: "menu:available" },
      ],
    ],
  };
}

export function formatLinkedMessage(userName: string): string {
  return `Telegram подключен к аккаунту ${userName}. Используйте кнопки ниже для быстрых действий.`;
}

export function formatPendingLinkMessage(): string {
  return "Не удалось подтвердить привязку. Укажите Telegram ID в настройках аккаунта wishlist и отправьте /start снова.";
}

export function formatAlreadyLinkedMessage(): string {
  return "Привязка уже подтверждена. Используйте кнопки меню для работы с подарками.";
}
