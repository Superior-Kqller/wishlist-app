import { NextRequest, NextResponse } from "next/server";
import { getTelegramConfig } from "@/lib/telegram/config";
import { handleTelegramUpdate } from "@/lib/telegram/actions";
import type { TelegramUpdate } from "@/lib/telegram/types";

function isWebhookAuthorized(req: NextRequest): boolean {
  const config = getTelegramConfig();
  if (!config.webhookSecret) return false;

  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (!header) return false;

  return header === config.webhookSecret;
}

export async function POST(req: NextRequest) {
  const config = getTelegramConfig();
  if (!config.enabled) {
    return NextResponse.json({ error: "Telegram integration disabled" }, { status: 503 });
  }

  if (!isWebhookAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as TelegramUpdate;
  if (!body || typeof body !== "object" || typeof body.update_id !== "number") {
    return NextResponse.json({ error: "Invalid telegram update payload" }, { status: 400 });
  }

  await handleTelegramUpdate(body);
  return NextResponse.json({ ok: true });
}
