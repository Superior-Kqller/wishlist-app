import NextAuth from "next-auth";
import { NextRequest } from "next/server";
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
      return rateLimitResponse;
    }
  }

  const params = await context.params;
  return handler(req, { params } as { params: { nextauth: string[] } });
}
