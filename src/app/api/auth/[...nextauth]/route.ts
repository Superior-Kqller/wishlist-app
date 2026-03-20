import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export const GET = handler;

type AuthRouteContext = {
  params: Promise<{ nextauth: string[] }> | { nextauth: string[] };
};

export async function POST(
  req: NextRequest,
  context: AuthRouteContext
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

  const resolvedParams =
    typeof (context.params as Promise<{ nextauth: string[] }>).then === "function"
      ? await (context.params as Promise<{ nextauth: string[] }>)
      : (context.params as { nextauth: string[] });

  return handler(req, { params: resolvedParams } as { params: { nextauth: string[] } });
}
