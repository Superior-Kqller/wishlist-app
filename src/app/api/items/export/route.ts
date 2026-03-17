import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { getVisibleListIdsForUser } from "@/lib/list-utils";

export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.read);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") || "csv";
  if (!["csv", "json"].includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const visibleListIds = await getVisibleListIdsForUser(userId);

  const items = await prisma.item.findMany({
    where: {
      userId,
      listId: { in: visibleListIds },
    },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const data = items.map((item) => ({
      title: item.title,
      url: item.url || "",
      price: item.price,
      currency: item.currency,
      priority: item.priority,
      tags: item.tags.map((t) => t.name).join(", "),
      notes: item.notes || "",
      purchased: item.purchased,
      createdAt: item.createdAt.toISOString(),
    }));

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="wishlist-${today}.json"`,
      },
    });
  }

  // CSV
  const BOM = "\uFEFF";
  const header = "Название,URL,Цена,Валюта,Приоритет,Теги,Заметки,Куплено,Дата создания";

  const escapeCSV = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = items.map((item) =>
    [
      escapeCSV(item.title),
      escapeCSV(item.url || ""),
      item.price?.toString() || "",
      item.currency,
      item.priority.toString(),
      escapeCSV(item.tags.map((t) => t.name).join("; ")),
      escapeCSV(item.notes || ""),
      item.purchased ? "Да" : "Нет",
      item.createdAt.toISOString(),
    ].join(","),
  );

  const csv = BOM + header + "\n" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wishlist-${today}.csv"`,
    },
  });
}
