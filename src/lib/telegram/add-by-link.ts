import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { parseWishlistProductUrl } from "@/lib/parser";
import { buildAddItemPath } from "@/lib/deep-links";
import {
  createItemSchema,
  createWishlistItem,
  type CreateItemInput,
} from "@/lib/wishlist/create-item";
import { notifyItemCreated } from "@/lib/telegram/notifications";
import {
  answerTelegramCallback,
  editTelegramMessage,
  sendTelegramMessage,
  sendTelegramTyping,
} from "@/lib/telegram/client";
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramReplyMarkup,
} from "@/lib/telegram/types";

type ParsedProduct = Awaited<ReturnType<typeof parseWishlistProductUrl>>;
type OwnList = { id: string; name: string };

/** Ссылка из сообщения. Telegram сам размечает адреса — и видимые, и спрятанные под словом. */
export function findMessageLink(message: TelegramMessage): string | null {
  for (const entity of message.entities ?? []) {
    const raw =
      entity.type === "text_link"
        ? entity.url
        : entity.type === "url"
          ? message.text?.slice(entity.offset, entity.offset + entity.length)
          : undefined;
    if (!raw) continue;
    // Адрес без схемы (`ozon.ru/…`) Telegram тоже считает ссылкой.
    const link = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    if (/^https?:\/\//i.test(link)) return link;
  }
  return null;
}

/** Свои подборки в порядке формы на сайте: первая по алфавиту — подборка по умолчанию. */
async function getOwnLists(userId: string): Promise<OwnList[]> {
  const lists = await prisma.list.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  return lists.sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

/**
 * Разобранная страница → желание. Цену и картинку проверяем порознь: кривая
 * картинка (относительный адрес) не должна уносить с собой верную цену.
 */
function toItemInput(parsed: ParsedProduct, link: string, listId: string): CreateItemInput {
  const image = parsed.images[0];
  return createItemSchema.parse({
    title: parsed.title.trim().slice(0, 500) || new URL(link).hostname,
    url: link,
    price:
      parsed.price !== null && Number.isFinite(parsed.price) && parsed.price >= 0
        ? parsed.price
        : undefined,
    currency: parsed.currency || "RUB",
    images: image && z.string().url().safeParse(image).success ? [image] : [],
    notes: parsed.description?.trim().slice(0, 2000) || undefined,
    listId,
  });
}

function addedMessage(
  item: { id: string; title: string; price: number | null; currency: string },
  listId: string,
  lists: OwnList[],
): { text: string; replyMarkup: TelegramReplyMarkup } {
  const listName = lists.find((list) => list.id === listId)?.name ?? "подборку";
  const text = [
    `🎁 Добавлено в «${listName}»`,
    `📌 ${item.title}`,
    item.price === null ? null : `💰 ${item.price} ${item.currency}`,
  ]
    .filter(Boolean)
    .join("\n");

  const rows = lists
    .filter((list) => list.id !== listId)
    .slice(0, 4)
    .map((list) => ({
      text: `Перенести в «${list.name}»`,
      callback_data: `mv:${item.id}:${list.id}`,
    }))
    // Больше 64 байт Telegram не примет и отклонит всё сообщение.
    .filter((button) => Buffer.byteLength(button.callback_data) <= 64)
    .map((button) => [button]);
  rows.push([{ text: "Удалить", callback_data: `rm:${item.id}` }]);

  return { text, replyMarkup: { inline_keyboard: rows } };
}

function parseFailedReply(chatId: string, link: string) {
  const base = process.env.NEXTAUTH_URL?.replace(/\/+$/, "");
  const formUrl = base ? `${base}${buildAddItemPath(link)}` : null;
  const text = "Не удалось прочитать страницу товара. Заполните желание на сайте";

  // Кнопку на непубличный адрес (localhost, http) Telegram отклоняет вместе с сообщением.
  if (formUrl?.startsWith("https://")) {
    return {
      chatId,
      text: `${text}.`,
      replyMarkup: { inline_keyboard: [[{ text: "Открыть форму", url: formUrl }]] },
    };
  }
  return { chatId, text: formUrl ? `${text}: ${formUrl}` : `${text}.` };
}

/**
 * Ссылка, присланная боту в личный чат, сразу становится желанием в подборке по
 * умолчанию; под ответом — кнопки перенести в другую подборку или удалить.
 * Черновиков не храним: в callback_data (64 байта) ссылка не помещается.
 */
export async function handleAddLink(actorId: string, chatId: string, link: string): Promise<void> {
  const lists = await getOwnLists(actorId);
  if (lists.length === 0) {
    await sendTelegramMessage({
      chatId,
      text: "Сначала создайте подборку на сайте — желание ляжет в неё.",
    });
    return;
  }

  await sendTelegramTyping(chatId).catch(() => undefined);

  let parsed: ParsedProduct;
  try {
    parsed = await parseWishlistProductUrl(link);
  } catch {
    await sendTelegramMessage(parseFailedReply(chatId, link));
    return;
  }

  const item = await createWishlistItem(actorId, toItemInput(parsed, link, lists[0].id));
  if (!item) return;

  await sendTelegramMessage({ chatId, ...addedMessage(item, lists[0].id, lists) });
  await notifyItemCreated({
    itemId: item.id,
    itemTitle: item.title,
    actorUserId: actorId,
    actorName: item.user?.name ?? "Пользователь",
  });
}

/** Кнопки под ответом на ссылку: `rm:<item>` и `mv:<item>:<list>`. Только свои желания и подборки. */
export async function handleAddedItemCallback(
  actorId: string,
  callback: TelegramCallbackQuery,
  action: "rm" | "mv",
  itemId: string,
  listId: string | undefined,
): Promise<void> {
  const chatId = callback.message ? String(callback.message.chat.id) : null;
  const messageId = callback.message?.message_id;

  if (action === "rm") {
    const { count } = await prisma.item.deleteMany({ where: { id: itemId, userId: actorId } });
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: count ? "Желание удалено" : "Желание не найдено",
      showAlert: !count,
    });
    if (count && chatId && messageId) {
      await editTelegramMessage({ chatId, messageId, text: "🗑 Желание удалено" });
    }
    return;
  }

  const lists = await getOwnLists(actorId);
  const target = lists.find((list) => list.id === listId);
  const moved = target
    ? await prisma.item.updateMany({
        where: { id: itemId, userId: actorId },
        data: { listId: target.id },
      })
    : { count: 0 };
  if (!target || !moved.count) {
    await answerTelegramCallback({
      callbackQueryId: callback.id,
      text: "Желание или подборка не найдены",
      showAlert: true,
    });
    return;
  }

  await answerTelegramCallback({
    callbackQueryId: callback.id,
    text: `Перенесено в «${target.name}»`,
  });
  if (chatId && messageId) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, price: true, currency: true },
    });
    if (item) {
      await editTelegramMessage({ chatId, messageId, ...addedMessage(item, target.id, lists) });
    }
  }
}
