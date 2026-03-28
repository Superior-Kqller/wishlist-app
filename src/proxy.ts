import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default withAuth(
  async function proxy(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = token?.role === "ADMIN";
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminPage && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    const connectSrc = isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'";

    const csp = [
      "default-src 'self'",
      // Next injects inline bootstrap/runtime scripts for App Router pages.
      // A nonce-only policy here leaves protected routes rendered but unhydrated.
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      connectSrc,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    const response = NextResponse.next();
    response.headers.set("Content-Security-Policy", csp);

    return response;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    // Исключаем PWA (service worker, precache) и статику, иначе middleware ломает установку/обновление SW
    "/((?!login|api/auth|api/health|api/integrations/telegram/webhook|_next|assets|favicon.ico|sw\\.js|workbox-[a-f0-9]+\\.js|swe-worker-[a-f0-9]+\\.js|manifest\\.webmanifest).*)",
  ],
};
