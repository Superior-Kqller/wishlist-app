import { describe, expect, it, vi } from "vitest";
import type { HolidayCatalogRepository } from "@/lib/calendar/holiday-catalog";
import { createHolidayHandlers } from "./holiday-handler";

function repository(): HolidayCatalogRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(async (input) => ({ id: "holiday-1", ...input })),
    update: vi.fn(),
  };
}

describe("/api/admin/holidays", () => {
  it("не позволяет обычному пользователю изменять каталог", async () => {
    const repo = repository();
    const handlers = createHolidayHandlers({
      getActor: async () => ({ role: "USER" }),
      repository: repo,
    });
    const response = await handlers.POST(
      new Request("http://localhost/api/admin/holidays", {
        method: "POST",
        body: JSON.stringify({
          name: "Праздник",
          rule: { kind: "FIXED", month: 1, day: 2 },
          enabled: true,
          remindersEnabled: true,
          theme: null,
        }),
      }),
    );
    expect(response.status).toBe(403);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("передаёт валидную команду администратора в модуль", async () => {
    const repo = repository();
    const handlers = createHolidayHandlers({
      getActor: async () => ({ role: "ADMIN" }),
      repository: repo,
    });
    const response = await handlers.POST(
      new Request("http://localhost/api/admin/holidays", {
        method: "POST",
        body: JSON.stringify({
          name: "Семейный праздник",
          rule: { kind: "FIXED", month: 7, day: 8 },
          enabled: true,
          remindersEnabled: false,
          theme: null,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(repo.create).toHaveBeenCalled();
  });

  it("отклоняет невозможную фиксированную дату", async () => {
    const repo = repository();
    const handlers = createHolidayHandlers({
      getActor: async () => ({ role: "ADMIN" }),
      repository: repo,
    });
    const response = await handlers.POST(
      new Request("http://localhost/api/admin/holidays", {
        method: "POST",
        body: JSON.stringify({
          name: "Неверная дата",
          rule: { kind: "FIXED", month: 2, day: 31 },
          enabled: true,
          remindersEnabled: true,
          theme: null,
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
