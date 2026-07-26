import { describe, expect, it, vi } from "vitest";
import {
  createHoliday,
  updateHoliday,
  type HolidayCatalogRepository,
} from "./holiday-catalog";

function repository(): HolidayCatalogRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(async (input) => ({ id: "created", ...input })),
    update: vi.fn(async (_id, input) => ({
      id: "holiday-1",
      name: "Праздник",
      rule: { kind: "FIXED", month: 1, day: 1 },
      enabled: true,
      remindersEnabled: true,
      theme: null,
      ...input,
    })),
  };
}

describe("holiday catalog commands", () => {
  it("обычный пользователь не может создать общий праздник", async () => {
    await expect(
      createHoliday(repository(), { role: "USER" }, {
        name: "Семейный день",
        rule: { kind: "FIXED", month: 6, day: 12 },
        enabled: true,
        remindersEnabled: true,
        theme: null,
      }),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("администратор может изменить название, правило и состояния", async () => {
    const repo = repository();
    await updateHoliday(repo, { role: "ADMIN" }, "holiday-1", {
      name: "Новая дата",
      rule: { kind: "NTH_WEEKDAY", month: 5, weekday: 1, occurrence: 2 },
      enabled: false,
      remindersEnabled: false,
      theme: null,
    });
    expect(repo.update).toHaveBeenCalledWith("holiday-1", {
      name: "Новая дата",
      rule: { kind: "NTH_WEEKDAY", month: 5, weekday: 1, occurrence: 2 },
      enabled: false,
      remindersEnabled: false,
      theme: null,
    });
  });
});
