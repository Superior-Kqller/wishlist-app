import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, name: true, avatarUrl: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return NextResponse.json({ users });
}
