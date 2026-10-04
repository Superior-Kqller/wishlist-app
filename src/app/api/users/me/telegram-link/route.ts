import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { unauthorizedResponse } from "@/lib/api-responses";
import { getTelegramConfig } from "@/lib/telegram/config";
import { getTelegramBotUsername, getTelegramWebhookUrl } from "@/lib/telegram/client";
import { createTelegramLinkToken } from "@/lib/telegram/linking";

// POST /api/users/me/telegram-link — ссылка t.me/<bot>?start=<токен> для привязки
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return unauthorizedResponse();
  }

  const config = getTelegramConfig();
  if (!config.enabled) {
    return NextResponse.json({ error: "Telegram-бот не настроен" }, { status: 503 });
  }

  try {
    const bot = await getTelegramBotUsername();
    // Без секрета бот сам забирает обновления. С секретом «Старт» дойдёт, только
    // если вебхук действительно поставлен — иначе говорим сразу, а не молчим.
    if (config.webhookSecret && !(await getTelegramWebhookUrl())) {
      return NextResponse.json(
        { error: "Бот не принимает команды: администратор не настроил вебхук" },
        { status: 503 },
      );
    }

    const token = await createTelegramLinkToken(userId);
    return NextResponse.json({ url: `https://t.me/${bot}?start=${token}` });
  } catch (err) {
    sanitizeError("Telegram link token error", err, { userId });
    return NextResponse.json({ error: "Не удалось связаться с Telegram" }, { status: 502 });
  }
}
