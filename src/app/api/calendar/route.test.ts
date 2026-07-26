import { describe, expect, it, vi } from "vitest";
import { createCalendarGetHandler } from "./calendar-handler";

describe("GET /api/calendar", () => {
  it("не раскрывает календарь без авторизации", async () => {
    const listOccurrences = vi.fn();
    const GET = createCalendarGetHandler({
      getActorId: async () => null,
      listOccurrences,
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-01-01&to=2027-12-31"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Необходима авторизация" });
    expect(listOccurrences).not.toHaveBeenCalled();
  });

  it("отклоняет неверный диапазон локальных дат", async () => {
    const GET = createCalendarGetHandler({
      getActorId: async () => "actor-1",
      listOccurrences: vi.fn(),
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-03-10&to=2027-03-01"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Некорректный диапазон дат" });
  });

  it("возвращает доступные вхождения в заданном диапазоне", async () => {
    const listOccurrences = vi.fn().mockResolvedValue([
      {
        id: "birthday:user-2:2027-04-10",
        type: "BIRTHDAY",
        date: "2027-04-10",
        person: { id: "user-2", name: "Алла", avatarUrl: null },
        isOwn: false,
      },
    ]);
    const GET = createCalendarGetHandler({
      getActorId: async () => "actor-1",
      listOccurrences,
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-04-01&to=2027-04-30"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      occurrences: [
        {
          id: "birthday:user-2:2027-04-10",
          type: "BIRTHDAY",
          date: "2027-04-10",
          person: { id: "user-2", name: "Алла", avatarUrl: null },
          isOwn: false,
        },
      ],
    });
    expect(listOccurrences).toHaveBeenCalledWith({
      actorId: "actor-1",
      rangeStart: "2027-04-01",
      rangeEnd: "2027-04-30",
    });
  });
});
