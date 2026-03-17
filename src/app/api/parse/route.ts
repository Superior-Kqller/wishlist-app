import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseProductUrl } from "@/lib/parser";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { z } from "zod";

const parseSchema = z.object({
  url: z.string().url().max(2048),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.parse);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!session?.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url } = parseSchema.parse(body);

    const product = await parseProductUrl(url);

    return NextResponse.json(product);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидный URL", details: err.issues },
        { status: 400 }
      );
    }

    const cause = err?.cause?.message ?? err?.message ?? "";
    const isRedirect = /redirect count exceeded|too many redirects/i.test(cause);
    const isFetchFailed = /fetch failed|ECONNREFUSED|ETIMEDOUT/i.test(cause);

    sanitizeError("Parse error", err);
    const message = isRedirect
      ? "Ссылка ведёт на цепочку перенаправлений. Введите ссылку на страницу товара вручную или попробуйте другой магазин."
      : isFetchFailed
        ? "Не удалось загрузить страницу (таймаут или сайт недоступен)."
        : err.message || "Не удалось получить данные со страницы";
    return NextResponse.json({ message }, { status: 422 });
  }
}
