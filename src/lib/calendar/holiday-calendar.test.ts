import { describe, expect, it } from "vitest";
import {
  listHolidayOccurrences,
  type HolidayCalendarRepository,
  type HolidayCalendarSource,
} from "./holiday-calendar";

function repositoryWith(holidays: HolidayCalendarSource[]): HolidayCalendarRepository {
  return { listEnabledHolidays: async () => holidays };
}

describe("listHolidayOccurrences", () => {
  it("рассчитывает фиксированные праздники и N-й день недели месяца", async () => {
    const occurrences = await listHolidayOccurrences(
      repositoryWith([
        {
          id: "new-year",
          name: "Новый год",
          rule: { kind: "FIXED", month: 1, day: 1 },
        },
        {
          id: "fathers-day",
          name: "День отца",
          rule: { kind: "NTH_WEEKDAY", month: 10, weekday: 0, occurrence: 3 },
        },
        {
          id: "mothers-day",
          name: "День матери",
          rule: { kind: "NTH_WEEKDAY", month: 11, weekday: 0, occurrence: -1 },
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
    };
    await expect(
      listHolidayOccurrences(repository, {
        actorId: "any-user",
        rangeStart: "2027-01-01",
        rangeEnd: "2027-12-31",
      }),
    ).resolves.toEqual([]);
  });
});
