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

    const nonce = crypto.randomUUID().replace(/-/g, "");

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
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
    "/((?!login|api/auth|api/health|_next|assets|favicon.ico).*)",
  ],
};
