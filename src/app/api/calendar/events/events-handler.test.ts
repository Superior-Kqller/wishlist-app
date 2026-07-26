import { describe, expect, it, vi } from "vitest";
import {
  createPersonalEventItemHandlers,
  createPersonalEventsHandlers,
} from "./events-handler";

const validEvent = {
  title: "Годовщина",
  description: null,
  date: "2027-08-12",
  recurrence: "YEARLY",
  audience: "SELECTED",
  selectedViewerIds: ["friend"],
} as const;

describe("/api/calendar/events handlers", () => {
  it("возвращает только собственные события в контексте текущего пользователя", async () => {
    const listOwnPersonalEvents = vi.fn().mockResolvedValue([
      { id: "own", ownerId: "actor", title: "Моё событие" },
    ]);
    const { GET } = createPersonalEventsHandlers({
      getActorId: async () => "actor",
      listOwnPersonalEvents,
      createPersonalEvent: vi.fn(),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(listOwnPersonalEvents).toHaveBeenCalledWith("actor");
    expect(await response.json()).toEqual({
      events: [{ id: "own", ownerId: "actor", title: "Моё событие" }],
    });
  });

  it("создаёт событие от имени пользователя, не принимая владельца из тела", async () => {
    const createPersonalEvent = vi.fn().mockResolvedValue({ id: "event", ownerId: "actor" });
    const { POST } = createPersonalEventsHandlers({
      getActorId: async () => "actor",
      listOwnPersonalEvents: vi.fn(),
      createPersonalEvent,
    });

    const response = await POST(new Request("http://localhost/api/calendar/events", {
      method: "POST",
      body: JSON.stringify({ ...validEvent, ownerId: "attacker" }),
    }));

    expect(response.status).toBe(201);
    expect(createPersonalEvent).toHaveBeenCalledWith("actor", validEvent);
  });

  it("не раскрывает различие между чужим и отсутствующим событием при изменении", async () => {
    const updatePersonalEvent = vi.fn().mockResolvedValue(null);
    const { PATCH } = createPersonalEventItemHandlers({
      getActorId: async () => "admin",
      updatePersonalEvent,
      deletePersonalEvent: vi.fn(),
    });

    const response = await PATCH(
      new Request("http://localhost/api/calendar/events/private", {
        method: "PATCH",
        body: JSON.stringify(validEvent),
      }),
      { params: Promise.resolve({ id: "private" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Событие не найдено" });
  });

  it("удаляет событие только в контексте владельца", async () => {
    const deletePersonalEvent = vi.fn().mockResolvedValue(true);
    const { DELETE } = createPersonalEventItemHandlers({
      getActorId: async () => "owner",
      updatePersonalEvent: vi.fn(),
      deletePersonalEvent,
    });

    const response = await DELETE(
      new Request("http://localhost/api/calendar/events/event", { method: "DELETE" }),
      { params: Promise.resolve({ id: "event" }) },
    );

    expect(response.status).toBe(200);
    expect(deletePersonalEvent).toHaveBeenCalledWith("owner", "event");
  });

  it("возвращает 400 для отсутствующего пользователя в выбранной аудитории", async () => {
    const { POST } = createPersonalEventsHandlers({
      getActorId: async () => "actor",
      listOwnPersonalEvents: vi.fn(),
      createPersonalEvent: vi.fn().mockRejectedValue(new Error("INVALID_EVENT_VIEWERS")),
    });

    const response = await POST(new Request("http://localhost/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(validEvent),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Некорректная аудитория события" });
  });
});
