import { describe, expect, it } from "vitest";
import {
  listBirthdayOccurrences,
  type BirthdayCalendarRepository,
  type BirthdayCalendarSource,
} from "./birthday-calendar";

function repositoryWith(
  birthdays: BirthdayCalendarSource[],
): BirthdayCalendarRepository {
  return {
    listBirthdays: async () => birthdays,
  };
}

const birthdays: BirthdayCalendarSource[] = [
  {
    userId: "all-owner",
    name: "Алла",
    avatarUrl: null,
    day: 10,
    month: 4,
    year: 1990,
    audience: "ALL",
    selectedViewerIds: [],
  },
  {
    userId: "selected-owner",
    name: "Света",
    avatarUrl: null,
    day: 12,
    month: 4,
    year: 1985,
    audience: "SELECTED",
    selectedViewerIds: ["selected-viewer"],
  },
  {
    userId: "private-owner",
    name: "Пётр",
    avatarUrl: null,
    day: 14,
    month: 4,
    year: null,
    audience: "PRIVATE",
    selectedViewerIds: [],
  },
];

describe("listBirthdayOccurrences", () => {
  it("возвращает актёру только доступные дни рождения и не раскрывает год или возраст", async () => {
    const occurrences = await listBirthdayOccurrences(repositoryWith(birthdays), {
      actorId: "selected-viewer",
      rangeStart: "2027-04-01",
      rangeEnd: "2027-04-30",
    });

    expect(occurrences).toEqual([
      {
        id: "birthday:all-owner:2027-04-10",
        type: "BIRTHDAY",
        date: "2027-04-10",
        person: { id: "all-owner", name: "Алла", avatarUrl: null },
        isOwn: false,
      },
      {
        id: "birthday:selected-owner:2027-04-12",
        type: "BIRTHDAY",
        date: "2027-04-12",
        person: { id: "selected-owner", name: "Света", avatarUrl: null },
        isOwn: false,
      },
    ]);
  });

  it("режим «всем» доступен любому нынешнему или будущему пользователю", async () => {
    const occurrences = await listBirthdayOccurrences(repositoryWith(birthdays), {
      actorId: "future-user",
      rangeStart: "2027-04-01",
      rangeEnd: "2027-04-30",
    });

    expect(occurrences.map((entry) => entry.person.id)).toEqual(["all-owner"]);
  });

  it("владелец всегда видит собственный день рождения", async () => {
    const occurrences = await listBirthdayOccurrences(repositoryWith(birthdays), {
      actorId: "private-owner",
      rangeStart: "2027-04-14",
      rangeEnd: "2027-04-14",
    });

    expect(occurrences).toEqual([
      expect.objectContaining({
        date: "2027-04-14",
        person: expect.objectContaining({ id: "private-owner" }),
        isOwn: true,
      }),
    ]);
  });

  it("переносит 29 февраля на 1 марта в невисокосном году и соблюдает диапазон", async () => {
    const leapBirthday: BirthdayCalendarSource = {
      userId: "leap-owner",
      name: "Лев",
      avatarUrl: null,
      day: 29,
      month: 2,
      year: null,
      audience: "ALL",
      selectedViewerIds: [],
    };

    const nonLeap = await listBirthdayOccurrences(repositoryWith([leapBirthday]), {
      actorId: "viewer",
      rangeStart: "2027-02-28",
      rangeEnd: "2027-03-01",
    });
    const leap = await listBirthdayOccurrences(repositoryWith([leapBirthday]), {
      actorId: "viewer",
      rangeStart: "2028-02-01",
      rangeEnd: "2028-02-29",
    });

    expect(nonLeap.map((entry) => entry.date)).toEqual(["2027-03-01"]);
    expect(leap.map((entry) => entry.date)).toEqual(["2028-02-29"]);
  });
});
