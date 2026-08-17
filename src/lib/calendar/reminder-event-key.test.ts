import { describe, expect, it } from "vitest";
import { createCalendarEvents } from "./calendar-events";
import type { CalendarEventSource } from "./calendar-event-source";
import { occurrenceReminderKey, reminderEventKey } from "./reminder-event-key";

const source: CalendarEventSource = {
  async listPeople() {
    return [
      {
        id: "person-1",
        name: "Аня",
        avatarUrl: null,
        birthdayDay: 14,
        birthdayMonth: 3,
        birthdayAudience: "ALL",
        birthdayViewerIds: [],
        gender: "FEMALE",
        thematicHolidayConsent: true,
      },
    ];
  },
  async listPersonalEvents() {
    return [
      {
        id: "event-1",
        ownerId: "person-1",
        title: "Годовщина",
        description: null,
        date: "2028-05-02",
        recurrence: "YEARLY",
        audience: "ALL",
        viewerIds: [],
      },
    ];
  },
  async listEnabledHolidays() {
    return [
      {
        id: "holiday-1",
        name: "Восьмое марта",
        rule: { kind: "FIXED", month: 3, day: 8 },
        remindersEnabled: true,
        theme: "FEMALE",
      },
    ];
  },
  async listWishlistsAccessibleBy() {
    return [];
  },
};

const range = { rangeStart: "2028-01-01", rangeEnd: "2028-12-31" };

describe("ключ заглушённого напоминания", () => {
  it("склеивает источник и идентификатор", () => {
    expect(reminderEventKey({ sourceType: "HOLIDAY", sourceId: "holiday-1" })).toBe(
      "HOLIDAY:holiday-1",
    );
  });

  /*
   * Тот самый шов, который раньше держался на честном слове: календарь строит
   * ключ из своего представления события, рассыльщик — из своего. Если стороны
   * разойдутся, заглушка перестанет находиться молча, поэтому равенство
   * проверяется на всех трёх источниках сразу.
   */
  it("совпадает у календаря и у рассыльщика для каждого источника", async () => {
    const events = createCalendarEvents(source);
    const [occurrences, facts] = await Promise.all([
      events.calendarFor("person-1", range),
      events.reminderFacts(range),
    ]);
    const factKeys = new Set(facts.map(reminderEventKey));

    expect(new Set(occurrences.map((occurrence) => occurrence.type))).toEqual(
      new Set(["BIRTHDAY", "PERSONAL", "HOLIDAY"]),
    );
    for (const occurrence of occurrences) {
      const key = occurrenceReminderKey(occurrence);
      expect([occurrence.type, factKeys.has(key)]).toEqual([occurrence.type, true]);
    }
  });
});
