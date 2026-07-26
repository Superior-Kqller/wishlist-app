import { describe, expect, it } from "vitest";
import {
  createCalendarModule,
  type PersonalEventRecord,
  type CalendarRepository,
} from "./calendar-module";

function repositoryWith(initialEvents: PersonalEventRecord[] = []): CalendarRepository {
  const events = [...initialEvents];
  return {
    findExistingUserIds: async (userIds) => userIds.filter((id) => id !== "missing"),
    listBirthdays: async () => [],
    listPersonalEvents: async () => events,
    createPersonalEvent: async (event) => {
      const created = {
        ...event,
        id: `event-${events.length + 1}`,
        selectedViewerIds: [...event.selectedViewerIds],
      };
      events.push(created);
      return created;
    },
    updatePersonalEvent: async (id, ownerId, event) => {
      const index = events.findIndex((entry) => entry.id === id && entry.ownerId === ownerId);
      if (index === -1) return null;
      events[index] = { ...events[index], ...event, selectedViewerIds: [...event.selectedViewerIds] };
      return events[index];
    },
    deletePersonalEvent: async (id, ownerId) => {
      const index = events.findIndex((entry) => entry.id === id && entry.ownerId === ownerId);
      if (index === -1) return false;
      events.splice(index, 1);
      return true;
    },
  };
}

describe("calendar module personal events", () => {
  it("создаёт однократное личное событие и возвращает его владельцу в диапазоне", async () => {
    const calendar = createCalendarModule(repositoryWith());

    const event = await calendar.createPersonalEvent("owner", {
      title: "Годовщина",
      description: "Заказать столик",
      date: "2027-04-18",
      recurrence: "ONCE",
      audience: "PRIVATE",
      selectedViewerIds: [],
    });
    const occurrences = await calendar.listOccurrences({
      actorId: "owner",
      rangeStart: "2027-04-01",
      rangeEnd: "2027-04-30",
    });

    expect(event).toEqual(expect.objectContaining({ id: "event-1", ownerId: "owner" }));
    expect(occurrences).toEqual([
      {
        id: "personal:event-1:2027-04-18",
        sourceId: "event-1",
        type: "PERSONAL",
        title: "Годовщина",
        description: "Заказать столик",
        date: "2027-04-18",
        recurrence: "ONCE",
        isOwn: true,
      },
    ]);
  });

  it("формирует следующее вхождение ежегодного события, сохраняя однократное в истории", async () => {
    const calendar = createCalendarModule(repositoryWith([
      {
        id: "once",
        ownerId: "owner",
        title: "Переезд",
        description: null,
        date: "2026-05-04",
        recurrence: "ONCE",
        audience: "PRIVATE",
        selectedViewerIds: [],
      },
      {
        id: "yearly",
        ownerId: "owner",
        title: "Годовщина",
        description: null,
        date: "2024-09-12",
        recurrence: "YEARLY",
        audience: "PRIVATE",
        selectedViewerIds: [],
      },
    ]));

    const history = await calendar.listOccurrences({
      actorId: "owner",
      rangeStart: "2026-01-01",
      rangeEnd: "2026-12-31",
    });
    const future = await calendar.listOccurrences({
      actorId: "owner",
      rangeStart: "2027-01-01",
      rangeEnd: "2027-12-31",
    });

    expect(history.map((entry) => entry.date)).toEqual(["2026-05-04", "2026-09-12"]);
    expect(future.map((entry) => entry.date)).toEqual(["2027-09-12"]);
  });

  it("не раскрывает закрытые события и не даёт администратору обходить аудиторию", async () => {
    const events: PersonalEventRecord[] = [
      {
        id: "all",
        ownerId: "owner",
        title: "Для всех",
        description: null,
        date: "2027-06-01",
        recurrence: "ONCE",
        audience: "ALL",
        selectedViewerIds: [],
      },
      {
        id: "selected",
        ownerId: "owner",
        title: "Для выбранных",
        description: null,
        date: "2027-06-02",
        recurrence: "ONCE",
        audience: "SELECTED",
        selectedViewerIds: ["friend"],
      },
      {
        id: "private",
        ownerId: "owner",
        title: "Секрет",
        description: "Не раскрывать",
        date: "2027-06-03",
        recurrence: "ONCE",
        audience: "PRIVATE",
        selectedViewerIds: [],
      },
    ];
    const calendar = createCalendarModule(repositoryWith(events));
    const query = { rangeStart: "2027-06-01", rangeEnd: "2027-06-30" };

    const friend = await calendar.listOccurrences({ ...query, actorId: "friend" });
    const admin = await calendar.listOccurrences({ ...query, actorId: "admin" });

    expect(friend.map((entry) => entry.id)).toEqual([
      "personal:all:2027-06-01",
      "personal:selected:2027-06-02",
    ]);
    expect(admin.map((entry) => entry.id)).toEqual(["personal:all:2027-06-01"]);
    expect(JSON.stringify(admin)).not.toContain("Секрет");
  });

  it("изменять и удалять событие может только владелец", async () => {
    const calendar = createCalendarModule(repositoryWith([
      {
        id: "event",
        ownerId: "owner",
        title: "Старое",
        description: null,
        date: "2027-07-01",
        recurrence: "ONCE",
        audience: "PRIVATE",
        selectedViewerIds: [],
      },
    ]));
    const update = {
      title: "Новое",
      description: null,
      date: "2027-07-02",
      recurrence: "ONCE" as const,
      audience: "ALL" as const,
      selectedViewerIds: [],
    };

    expect(await calendar.updatePersonalEvent("admin", "event", update)).toBeNull();
    expect(await calendar.deletePersonalEvent("admin", "event")).toBe(false);
    expect(await calendar.updatePersonalEvent("owner", "event", update)).toEqual(
      expect.objectContaining({ title: "Новое" }),
    );
    expect(await calendar.deletePersonalEvent("owner", "event")).toBe(true);
  });

  it("отклоняет отсутствующих пользователей в выбранной аудитории", async () => {
    const calendar = createCalendarModule(repositoryWith());

    await expect(calendar.createPersonalEvent("owner", {
      title: "Закрытая дата",
      description: null,
      date: "2027-07-20",
      recurrence: "ONCE",
      audience: "SELECTED",
      selectedViewerIds: ["friend", "missing"],
    })).rejects.toThrow("INVALID_EVENT_VIEWERS");
  });
});
