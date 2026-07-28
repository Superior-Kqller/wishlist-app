import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createPglitePrisma } from "@/test/pglite-prisma";
import { createPrismaCalendarReminderRepository } from "./prisma-reminder-persistence";

describe("calendar reminder persistence with Prisma adapter", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;
    await prisma.user.create({
      data: {
        id: "recipient",
        username: "recipient",
        password: "hash",
        name: "Получатель",
        telegramId: "10001",
        telegramConfirmedAt: new Date("2027-01-01T00:00:00Z"),
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        calendarEventMutes: {
          create: { sourceType: "PERSONAL", sourceId: "muted" },
        },
      },
    });
  }, 30_000);

  afterAll(async () => {
    await close();
  });

  it("читает настройки и атомарно заявляет доставку", async () => {
    const repository = createPrismaCalendarReminderRepository(prisma);
    await expect(
      repository.listEligibleRecipients(["recipient", "recipient"]),
    ).resolves.toEqual([
      {
        id: "recipient",
        telegramId: "10001",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        mutedEventKeys: ["PERSONAL:muted"],
      },
    ]);

    const delivery = {
      recipientId: "recipient",
      sourceType: "PERSONAL" as const,
      sourceId: "event",
      occurrenceDate: "2027-08-31",
      checkpointDays: 30 as const,
    };
    await expect(repository.claimDelivery(delivery)).resolves.toBe(true);
    await expect(repository.claimDelivery(delivery)).resolves.toBe(false);
  });
});
