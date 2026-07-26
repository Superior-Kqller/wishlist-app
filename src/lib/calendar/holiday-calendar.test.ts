import { describe, expect, it } from "vitest";
import {
  listHolidayOccurrences,
  type HolidayCalendarRepository,
  type HolidayCalendarSource,
} from "./holiday-calendar";

function repositoryWith(holidays: HolidayCalendarSource[]): HolidayCalendarRepository {
  return {
    listEnabledHolidays: async () => holidays,
    listThematicCandidates: async () => [],
  };
}

describe("listHolidayOccurrences", () => {
  it("рассчитывает фиксированные праздники и N-й день недели месяца", async () => {
    const occurrences = await listHolidayOccurrences(
      repositoryWith([
        {
          id: "new-year",
          name: "Новый год",
          rule: { kind: "FIXED", month: 1, day: 1 },
          theme: null,
        },
        {
          id: "fathers-day",
          name: "День отца",
          rule: { kind: "NTH_WEEKDAY", month: 10, weekday: 0, occurrence: 3 },
          theme: null,
        },
        {
          id: "mothers-day",
          name: "День матери",
          rule: { kind: "NTH_WEEKDAY", month: 11, weekday: 0, occurrence: -1 },
          theme: null,
        },
      ]),
      { actorId: "future-user", rangeStart: "2027-01-01", rangeEnd: "2027-12-31" },
    );

    expect(occurrences.map(({ name, date }) => ({ name, date }))).toEqual([
      { name: "Новый год", date: "2027-01-01" },
      { name: "День отца", date: "2027-10-17" },
      { name: "День матери", date: "2027-11-28" },
    ]);
  });

  it("не возвращает отключённые праздники по контракту репозитория", async () => {
    const repository: HolidayCalendarRepository = {
      listEnabledHolidays: async () => [],
      listThematicCandidates: async () => [],
    };
    await expect(
      listHolidayOccurrences(repository, {
        actorId: "any-user",
        rangeStart: "2027-01-01",
        rangeEnd: "2027-12-31",
      }),
    ).resolves.toEqual([]);
  });

  it("показывает на тематическом празднике только согласившихся и доступные вишлисты", async () => {
    const repository: HolidayCalendarRepository = {
      listEnabledHolidays: async () => [
        {
          id: "defender-day",
          name: "День защитника Отечества",
          rule: { kind: "FIXED", month: 2, day: 23 },
          theme: "MALE",
        },
        {
          id: "womens-day",
          name: "Международный женский день",
          rule: { kind: "FIXED", month: 3, day: 8 },
          theme: "FEMALE",
        },
      ],
      listThematicCandidates: async (actorId) => {
        expect(actorId).toBe("viewer");
        return [
          {
            id: "male-consented",
            name: "Алексей",
            avatarUrl: null,
            gender: "MALE",
            consent: true,
            wishlists: [{ id: "list-shared", name: "Подарки" }],
          },
          {
            id: "male-without-consent",
            name: "Иван",
            avatarUrl: null,
            gender: "MALE",
            consent: false,
            wishlists: [{ id: "list-hidden", name: "Скрытый список" }],
          },
          {
            id: "female-consented",
            name: "Анна",
            avatarUrl: null,
            gender: "FEMALE",
            consent: true,
            wishlists: [],
          },
        ];
      },
    };

    const occurrences = await listHolidayOccurrences(repository, {
      actorId: "viewer",
      rangeStart: "2027-02-01",
      rangeEnd: "2027-03-31",
    });

    expect(occurrences).toEqual([
      {
        id: "holiday:defender-day:2027-02-23",
        type: "HOLIDAY",
        date: "2027-02-23",
        name: "День защитника Отечества",
        congratulated: [
          {
            id: "male-consented",
            name: "Алексей",
            avatarUrl: null,
            wishlists: [{ id: "list-shared", name: "Подарки" }],
          },
        ],
      },
      {
        id: "holiday:womens-day:2027-03-08",
        type: "HOLIDAY",
        date: "2027-03-08",
        name: "Международный женский день",
        congratulated: [
          {
            id: "female-consented",
            name: "Анна",
            avatarUrl: null,
            wishlists: [],
          },
        ],
      },
    ]);
    expect(JSON.stringify(occurrences)).not.toContain("gender");
    expect(JSON.stringify(occurrences)).not.toContain("male-without-consent");
    expect(JSON.stringify(occurrences)).not.toContain("list-hidden");
  });

  it("сразу исключает пользователя из будущих вхождений после отзыва согласия", async () => {
    let consent = true;
    const repository: HolidayCalendarRepository = {
      listEnabledHolidays: async () => [
        {
          id: "defender-day",
          name: "23 февраля",
          rule: { kind: "FIXED", month: 2, day: 23 },
          theme: "MALE",
        },
      ],
      listThematicCandidates: async () => [
        {
          id: "user-1",
          name: "Алексей",
          avatarUrl: null,
          gender: "MALE",
          consent,
          wishlists: [],
        },
      ],
    };
    const query = {
      actorId: "viewer",
      rangeStart: "2027-01-01",
      rangeEnd: "2028-12-31",
    };

    const beforeRevocation = await listHolidayOccurrences(repository, query);
    consent = false;
    const afterRevocation = await listHolidayOccurrences(repository, query);

    expect(beforeRevocation.every((entry) => entry.congratulated.length === 1)).toBe(true);
    expect(afterRevocation.every((entry) => entry.congratulated.length === 0)).toBe(true);
  });
});
