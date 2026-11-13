import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createPglitePrisma } from "@/test/pglite-prisma";
import { createSanta, drawPairs } from "./santa";

describe("drawPairs", () => {
  it("никто не достаётся сам себе, каждый дарит и получает ровно один раз", () => {
    const ids = ["a", "b", "c", "d", "e"];
    for (let round = 0; round < 200; round++) {
      const pairs = drawPairs(ids);
      expect(pairs.every((pair) => pair.giverId !== pair.receiverId)).toBe(true);
      expect(pairs.map((pair) => pair.giverId).sort()).toEqual(ids);
      expect(pairs.map((pair) => pair.receiverId).sort()).toEqual(ids);
    }
  });

  it("при трёх участниках нет пар «друг другу»", () => {
    for (let round = 0; round < 50; round++) {
      const receiverOf = new Map(
        drawPairs(["a", "b", "c"]).map((pair) => [pair.giverId, pair.receiverId]),
      );
      for (const [giver, receiver] of receiverOf) expect(receiverOf.get(receiver)).not.toBe(giver);
    }
  });
});

describe("Santa with Prisma adapter", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;
  const input = { title: "Новый год", eventDate: "2026-12-31", budget: "до 2000 ₽" };

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;
    await prisma.user.createMany({
      data: ["boss", "a", "b", "c", "outsider"].map((id) => ({
        id,
        username: id,
        password: "hash",
        name: id.toUpperCase(),
      })),
    });
  }, 30_000);

  afterAll(async () => {
    await close();
  });

  it("каждый видит только своего поздравляемого, посторонний — ничего", async () => {
    const santa = createSanta(prisma);
    const created = await santa.create("boss", { ...input, participantIds: ["a", "b", "c", "a"] });
    expect(created.pairs).toHaveLength(3);

    const receivers: string[] = [];
    for (const giver of ["a", "b", "c"]) {
      const [view, ...rest] = await santa.listFor(giver);
      expect(rest).toEqual([]);
      expect(view).toMatchObject({
        isOrganizer: false,
        participantCount: 3,
        organizerName: "BOSS",
      });
      expect(view.receiver!.id).not.toBe(giver);
      expect(JSON.stringify(view)).not.toContain("giverId");
      receivers.push(view.receiver!.id);
    }
    expect(receivers.sort()).toEqual(["a", "b", "c"]);

    // Организатор вне жеребьёвки видит её, но не пары.
    expect(await santa.listFor("boss")).toMatchObject([{ isOrganizer: true, receiver: null }]);
    expect(await santa.listFor("outsider")).toEqual([]);
  });

  it("отменить может только организатор", async () => {
    const santa = createSanta(prisma);
    const [{ id }] = await santa.listFor("boss");
    expect(await santa.remove("a", id)).toBe(false);
    expect(await santa.remove("boss", id)).toBe(true);
    expect(await santa.listFor("a")).toEqual([]);
  });

  it("отклоняет слишком маленький круг и неизвестных участников", async () => {
    const santa = createSanta(prisma);
    await expect(santa.create("boss", { ...input, participantIds: ["a", "b"] })).rejects.toThrow(
      "SANTA_TOO_FEW",
    );
    await expect(
      santa.create("boss", { ...input, participantIds: ["a", "b", "ghost"] }),
    ).rejects.toThrow("SANTA_UNKNOWN_PARTICIPANT");
  });
});
