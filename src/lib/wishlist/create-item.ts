import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeProductCategory } from "@/lib/categories";

/** Одна проверка для формы на сайте и для ссылки, присланной боту. */
export const createItemSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().optional().or(z.literal("")),
  price: z.number().min(0).optional(),
  currency: z.string().default("RUB"),
  priority: z.number().min(1).max(5).default(3),
  images: z.array(z.string().url()).max(1).default([]),
  notes: z.string().max(2000).optional(),
  category: z.string().trim().max(80).nullable().optional(),
  listId: z.string().trim().nullable().optional(),
});

export type CreateItemInput = z.output<typeof createItemSchema>;

/** Новое желание; `null` — подборки нет или она чужая. */
export async function createWishlistItem(userId: string, data: CreateItemInput) {
  const listId = data.listId ?? null;
  if (listId) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { userId: true },
    });
    if (!list || list.userId !== userId) return null;
  }

  return prisma.item.create({
    data: {
      title: data.title,
      url: data.url || null,
      price: data.price ?? null,
      currency: data.currency,
      priority: data.priority,
      images: data.images,
      notes: data.notes || null,
      category: normalizeProductCategory(data.category),
      status: "AVAILABLE",
      userId,
      listId,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}
