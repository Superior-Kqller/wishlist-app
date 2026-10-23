import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
): Promise<Response> {
  const url = new URL(req.url);
  const normalizedPathname = url.pathname.replace(/\/+$/, "");
  const isCredentialsCallback = normalizedPathname.endsWith("/callback/credentials");

  if (isCredentialsCallback) {
    const rateLimitResponse = await rateLimit(req, rateLimitPresets.auth);
    if (rateLimitResponse) {
      // Клиент NextAuth разбирает `new URL(data.url)` и при 429 без `url` падает с Invalid URL:
      // добавляем url с кодом ошибки, статус и Retry-After остаются.
      const body = (await rateLimitResponse.json()) as { retryAfter: number };
      const headers = new Headers(rateLimitResponse.headers);
      headers.delete("content-length");
      return NextResponse.json(
        { ...body, url: `${url.origin}/login?error=RateLimit%3A${body.retryAfter}` },
        { status: 429, headers },
      );
    }
  }

  const params = await context.params;
  return handler(req, { params } as { params: { nextauth: string[] } });
}
