import type { NextRequest } from "next/server";
import { buildAddItemPath, findSharedLink } from "@/lib/deep-links";

/**
 * Цель `share_target` из манифеста: «Поделиться» в Android открывает форму
 * добавления. `Location` относительный — за обратным прокси `req.url` бывает
 * внутренним адресом контейнера.
 */
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const link = findSharedLink(searchParams.get("url"), searchParams.get("text"));
  return new Response(null, {
    status: 303,
    headers: { Location: link ? buildAddItemPath(link) : "/" },
  });
}
