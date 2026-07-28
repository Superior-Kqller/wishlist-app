import { describe, expect, it, vi } from "vitest";
import { createCalendarGetHandler } from "./calendar-handler";

describe("GET /api/calendar", () => {
  it("не раскрывает календарь без авторизации", async () => {
    const calendarFor = vi.fn();
    const GET = createCalendarGetHandler({
      getActorId: async () => null,
      calendarFor,
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-01-01&to=2027-12-31"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Необходима авторизация" });
    expect(calendarFor).not.toHaveBeenCalled();
  });

  it("отклоняет неверный диапазон локальных дат", async () => {
    const GET = createCalendarGetHandler({
      getActorId: async () => "actor-1",
      calendarFor: vi.fn(),
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-03-10&to=2027-03-01"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Некорректный диапазон дат" });
  });

  it("возвращает доступные вхождения в заданном диапазоне", async () => {
    const calendarFor = vi.fn().mockResolvedValue([
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
      calendarFor,
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
    expect(calendarFor).toHaveBeenCalledWith("actor-1", {
      rangeStart: "2027-04-01",
      rangeEnd: "2027-04-30",
    });
  });

  it("возвращает поздравляемых без прямого раскрытия пола", async () => {
    const calendarFor = vi.fn().mockResolvedValue([
      {
        id: "holiday:womens-day:2027-03-08",
        type: "HOLIDAY",
        date: "2027-03-08",
        name: "8 марта",
        congratulated: [
          {
            id: "user-2",
            name: "Анна",
            avatarUrl: null,
            wishlists: [{ id: "list-2", name: "Мои желания" }],
          },
        ],
      },
    ]);
    const GET = createCalendarGetHandler({
      getActorId: async () => "actor-1",
      calendarFor,
    });

    const response = await GET(
      new Request("http://localhost/api/calendar?from=2027-03-01&to=2027-03-31"),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.occurrences[0].congratulated[0].wishlists).toEqual([
      { id: "list-2", name: "Мои желания" },
    ]);
    expect(JSON.stringify(json)).not.toContain("gender");
  });
});
