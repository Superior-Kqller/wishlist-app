import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createPglitePrisma } from "@/test/pglite-prisma";
import { createPersonalEvents } from "./personal-events";
import { createPrismaPersonalEventRepository } from "./prisma-personal-event-repository";

describe("PersonalEvents with Prisma adapter", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;
    await prisma.user.createMany({
      data: [
        { id: "owner", username: "owner", password: "hash", name: "Владелец" },
        { id: "friend", username: "friend", password: "hash", name: "Друг" },
        { id: "other", username: "other", password: "hash", name: "Другой" },
      ],
    });
  }, 30_000);

  afterAll(async () => {
    await close();
  });

  it("создаёт, читает и изменяет событие только через права владельца", async () => {
    const events = createPersonalEvents(createPrismaPersonalEventRepository(prisma));
    const created = await events.create("owner", {
      title: "  Годовщина  ",
      description: "  Заказать столик  ",
      date: "2027-04-18",
      recurrence: "ONCE",
      audience: "SELECTED",
      selectedViewerIds: ["owner", "friend", "friend"],
    });

    expect(await events.listOwn("owner")).toEqual([
      {
        ...created,
        title: "Годовщина",
        description: "Заказать столик",
        selectedViewerIds: ["friend"],
      },
    ]);
    await expect(
      events.update("other", created.id, {
        title: "Чужое",
        description: null,
        date: "2027-04-19",
        recurrence: "ONCE",
        audience: "PRIVATE",
        selectedViewerIds: [],
      }),
    ).resolves.toBeNull();
    await expect(events.delete("other", created.id)).resolves.toBe(false);
  });
});
