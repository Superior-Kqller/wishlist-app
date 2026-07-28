import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createPglitePrisma } from "@/test/pglite-prisma";
import { createCalendarEvents } from "./calendar-events";
import { createPrismaCalendarEventSource } from "./prisma-calendar-event-source";

describe("CalendarEvents with Prisma adapter", () => {
  let prisma: PrismaClient;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const context = await createPglitePrisma();
    prisma = context.prisma;
    close = context.close;

    await prisma.user.createMany({
      data: [
        {
          id: "person",
          username: "person",
          password: "hash",
          name: "Анна",
          birthdayDay: 29,
          birthdayMonth: 2,
          birthdayAudience: "SELECTED",
          gender: "FEMALE",
          thematicHolidayConsent: true,
        },
        {
          id: "actor",
          username: "actor",
          password: "hash",
          name: "Борис",
        },
        {
          id: "outsider",
          username: "outsider",
          password: "hash",
          name: "Вера",
        },
      ],
    });
    await prisma.birthdayViewer.create({
      data: { ownerId: "person", viewerId: "actor" },
    });
    await prisma.list.create({
      data: {
        id: "list",
        name: "Мечты",
        userId: "person",
        viewers: { create: { userId: "actor" } },
      },
    });
    await prisma.personalEvent.create({
      data: {
        id: "personal",
        ownerId: "person",
        title: "Встреча",
        localDate: "2024-03-01",
        recurrence: "YEARLY",
        audience: "SELECTED",
        viewers: { create: { viewerId: "actor" } },
      },
    });
    await prisma.personalEvent.create({
      data: {
        id: "leap-personal",
        ownerId: "person",
        title: "Дата високосного года",
        localDate: "2024-02-29",
        recurrence: "YEARLY",
        audience: "PRIVATE",
      },
    });
    await prisma.holiday.create({
      data: {
        id: "holiday",
        name: "Женский день",
        ruleKind: "FIXED",
        month: 3,
        day: 8,
        theme: "FEMALE",
      },
    });
  }, 30_000);

  afterAll(async () => {
    await close();
  });

  it("собирает видимый календарь и не раскрывает внутренние признаки тематического праздника", async () => {
    const events = createCalendarEvents(createPrismaCalendarEventSource(prisma));

    await expect(
      events.calendarFor("actor", {
        rangeStart: "2027-02-28",
        rangeEnd: "2027-03-08",
      }),
    ).resolves.toEqual([
      {
        id: "birthday:person:2027-03-01",
        type: "BIRTHDAY",
        date: "2027-03-01",
        person: { id: "person", name: "Анна", avatarUrl: null },
        isOwn: false,
      },
      {
        id: "personal:personal:2027-03-01",
        sourceId: "personal",
        type: "PERSONAL",
        title: "Встреча",
        description: null,
        date: "2027-03-01",
        recurrence: "YEARLY",
        isOwn: false,
      },
      {
        id: "holiday:holiday:2027-03-08",
        type: "HOLIDAY",
        date: "2027-03-08",
        name: "Женский день",
        congratulated: [
          {
            id: "person",
            name: "Анна",
            avatarUrl: null,
            wishlists: [{ id: "list", name: "Мечты" }],
          },
        ],
      },
    ]);
  });

  it("возвращает для напоминаний только максимальную аудиторию и уже доступные вишлисты", async () => {
    const events = createCalendarEvents(createPrismaCalendarEventSource(prisma));

    const facts = await events.reminderFacts({
      rangeStart: "2027-02-28",
      rangeEnd: "2027-03-08",
    });

    expect(facts).toEqual([
      {
        sourceType: "BIRTHDAY",
        sourceId: "person",
        occurrenceDate: "2027-03-01",
        title: "День рождения: Анна",
        audienceUserIds: ["person", "actor"],
        excludedRecipientIds: ["person"],
        congratulated: ["Анна"],
        wishlistLinksByRecipient: {
          person: [
            {
              label: "Вишлист «Мечты»",
              href: "/?userId=person&listId=list",
            },
          ],
          actor: [
            {
              label: "Вишлист «Мечты»",
              href: "/?userId=person&listId=list",
            },
          ],
        },
      },
      {
        sourceType: "PERSONAL",
        sourceId: "personal",
        occurrenceDate: "2027-03-01",
        title: "Встреча",
        audienceUserIds: ["person", "actor"],
        excludedRecipientIds: [],
        congratulated: [],
        wishlistLinksByRecipient: {},
      },
      {
        sourceType: "PERSONAL",
        sourceId: "leap-personal",
        occurrenceDate: "2027-02-29",
        title: "Дата високосного года",
        audienceUserIds: ["person"],
        excludedRecipientIds: [],
        congratulated: [],
        wishlistLinksByRecipient: {},
      },
      {
        sourceType: "HOLIDAY",
        sourceId: "holiday",
        occurrenceDate: "2027-03-08",
        title: "Женский день",
        audienceUserIds: ["person", "actor", "outsider"],
        excludedRecipientIds: ["person"],
        congratulated: ["Анна"],
        wishlistLinksByRecipient: {
          person: [
            {
              label: "Вишлист «Мечты»",
              href: "/?userId=person&listId=list",
            },
          ],
          actor: [
            {
              label: "Вишлист «Мечты»",
              href: "/?userId=person&listId=list",
            },
          ],
          outsider: [],
        },
      },
    ]);
  });
});
