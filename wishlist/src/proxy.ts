import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default withAuth(
  async function proxy(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAdmin = (token?.role as string) === "ADMIN";
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    // Защита админ-страниц: только для админов
    if (isAdminPage && !isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /_next (static files)
     * - /favicon.ico
     * - /api/health (health check)
     */
    "/((?!login|api/auth|api/health|_next|favicon.ico).*)",
  ],
};
