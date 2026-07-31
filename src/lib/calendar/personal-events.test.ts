import { describe, expect, it } from "vitest";
import {
  createPersonalEvents,
  type PersonalEventRecord,
  type PersonalEventRepository,
} from "./personal-events";

function repositoryWith(initialEvents: PersonalEventRecord[] = []): PersonalEventRepository {
  const events = [...initialEvents];
  return {
    findExistingUserIds: async (userIds) => userIds.filter((id) => id !== "missing"),
    listByOwner: async (ownerId) => events.filter((event) => event.ownerId === ownerId),
    create: async (event) => {
      const created = { ...event, id: `event-${events.length + 1}` };
      events.push(created);
      return created;
    },
    update: async (id, ownerId, event) => {
      const index = events.findIndex((entry) => entry.id === id && entry.ownerId === ownerId);
      if (index === -1) return null;
      events[index] = { ...events[index], ...event };
      return events[index];
    },
    delete: async (id, ownerId) => {
      const index = events.findIndex((entry) => entry.id === id && entry.ownerId === ownerId);
      if (index === -1) return false;
      events.splice(index, 1);
      return true;
    },
  };
}

describe("PersonalEvents", () => {
  it("нормализует ввод и исключает владельца и повторы из аудитории", async () => {
    const events = createPersonalEvents(repositoryWith());

    await expect(
      events.create("owner", {
        title: "  Годовщина  ",
        description: "  Заказать столик  ",
        date: "2027-04-18",
        recurrence: "ONCE",
        audience: "SELECTED",
        selectedViewerIds: ["owner", "friend", "friend"],
      }),
    ).resolves.toEqual({
      id: "event-1",
      ownerId: "owner",
      title: "Годовщина",
      description: "Заказать столик",
      date: "2027-04-18",
      recurrence: "ONCE",
      audience: "SELECTED",
      selectedViewerIds: ["friend"],
    });
  });

  it("не позволяет изменять или удалять чужое событие", async () => {
    const events = createPersonalEvents(
      repositoryWith([
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
      ]),
    );
    const update = {
      title: "Новое",
      description: null,
      date: "2027-07-02",
      recurrence: "ONCE" as const,
      audience: "ALL" as const,
      selectedViewerIds: [],
    };

    await expect(events.update("other", "event", update)).resolves.toBeNull();
    await expect(events.delete("other", "event")).resolves.toBe(false);
  });

  it("отклоняет отсутствующих пользователей в выбранной аудитории", async () => {
    const events = createPersonalEvents(repositoryWith());

    await expect(
      events.create("owner", {
        title: "Закрытая дата",
        description: null,
        date: "2027-07-20",
        recurrence: "ONCE",
        audience: "SELECTED",
        selectedViewerIds: ["friend", "missing"],
      }),
    ).rejects.toThrow("INVALID_EVENT_VIEWERS");
  });
});
