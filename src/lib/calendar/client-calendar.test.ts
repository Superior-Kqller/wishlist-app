import { describe, expect, it } from "vitest";
import {
  filterCalendarOccurrences,
  groupCalendarOccurrences,
  getCalendarSections,
  getInitialCalendarView,
  getUpcomingOccurrences,
  type CalendarOccurrence,
} from "./client-calendar";

const occurrences: CalendarOccurrence[] = [
  {
    id: "past",
    sourceId: "past",
    type: "PERSONAL",
    title: "Без изменения регистра",
    description: null,
    date: "2026-07-20",
    recurrence: "ONCE",
    isOwn: true,
  },
  {
    id: "birthday",
    type: "BIRTHDAY",
    date: "2026-07-28",
    person: { id: "user-1", name: "Анна", avatarUrl: null },
    isOwn: false,
  },
  {
    id: "holiday",
    type: "HOLIDAY",
    date: "2026-07-29",
    name: "Общий праздник",
    congratulated: [],
  },
  {
    id: "personal",
    sourceId: "personal",
    type: "PERSONAL",
    title: "Годовщина",
    description: null,
    date: "2026-07-30",
    recurrence: "YEARLY",
    isOwn: true,
  },
  {
    id: "fourth",
    type: "HOLIDAY",
    date: "2026-08-01",
    name: "Четвёртое событие",
    congratulated: [],
  },
];

describe("client calendar", () => {
  it("filters occurrences by the selected source", () => {
    expect(filterCalendarOccurrences(occurrences, "BIRTHDAY").map(({ id }) => id)).toEqual([
      "birthday",
    ]);
    expect(filterCalendarOccurrences(occurrences, "ALL")).toEqual(occurrences);
  });

  it("groups upcoming and past one-time occurrences into separate sections", () => {
    expect(getCalendarSections(occurrences, "2026-07-27")).toEqual({
      upcoming: occurrences.slice(1),
      history: [occurrences[0]],
    });
  });

  it("groups occurrences that share a calendar date", () => {
    const sameDay = { ...occurrences[2], id: "holiday-2", date: "2026-07-28" };
    expect(
      groupCalendarOccurrences([occurrences[1], sameDay, occurrences[3]]).map(
        ([date, entries]) => [date, entries.map(({ id }) => id)],
      ),
    ).toEqual([
      ["2026-07-28", ["birthday", "holiday-2"]],
      ["2026-07-30", ["personal"]],
    ]);
  });

  it("returns the nearest three accessible occurrences", () => {
    expect(
      getUpcomingOccurrences(occurrences, "2026-07-27", 3).map(({ id }) => id),
    ).toEqual(["birthday", "holiday", "personal"]);
  });

  it("uses list view initially on mobile and month view on wide screens", () => {
    expect(getInitialCalendarView(true)).toBe("list");
    expect(getInitialCalendarView(false)).toBe("month");
  });
});
