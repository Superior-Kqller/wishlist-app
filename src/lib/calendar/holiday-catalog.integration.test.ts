import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createPglitePrisma } from "@/test/pglite-prisma";
import { createHolidayCatalog } from "./holiday-catalog";
import { createPrismaHolidayCatalogRepository } from "./prisma-holiday-catalog-repository";

describe("HolidayCatalog with Prisma adapter", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;
  }, 30_000);

  afterAll(async () => {
    await close();
  });

  it("сам проверяет права и валидирует каталог перед записью", async () => {
    const catalog = createHolidayCatalog(createPrismaHolidayCatalogRepository(prisma));
    const input = {
      name: "  Семейный день  ",
      rule: { kind: "FIXED" as const, month: 6, day: 12 },
      enabled: true,
      remindersEnabled: true,
      theme: null,
    };

    await expect(catalog.create({ role: "USER" }, input)).rejects.toThrow("FORBIDDEN");
    const created = await catalog.create({ role: "ADMIN" }, input);
    await expect(catalog.list({ role: "ADMIN" })).resolves.toEqual([
      { ...created, name: "Семейный день" },
    ]);
    await expect(catalog.update({ role: "ADMIN" }, created.id, {})).rejects.toThrow(
      "INVALID_HOLIDAY",
    );
  });
});
