import { describe, expect, it, vi } from "vitest";
import { createCalendarSettingsHandlers } from "./settings-handler";

describe("calendar settings handlers", () => {
  it("не разрешает обычному пользователю менять временную зону", async () => {
    const updateSettings = vi.fn();
    const handlers = createCalendarSettingsHandlers({
      getActor: vi.fn().mockResolvedValue({ role: "USER" }),
      getSettings: vi.fn(),
      updateSettings,
    });

    const response = await handlers.PATCH(
      new Request("http://localhost/api/admin/calendar-settings", {
        method: "PATCH",
        body: JSON.stringify({ timeZone: "Europe/Berlin" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("передаёт валидную настройку от администратора", async () => {
    const updateSettings = vi.fn().mockResolvedValue({ timeZone: "Europe/Berlin" });
    const handlers = createCalendarSettingsHandlers({
      getActor: vi.fn().mockResolvedValue({ role: "ADMIN" }),
      getSettings: vi.fn(),
      updateSettings,
    });

    const response = await handlers.PATCH(
      new Request("http://localhost/api/admin/calendar-settings", {
        method: "PATCH",
        body: JSON.stringify({ timeZone: "Europe/Berlin" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSettings).toHaveBeenCalledWith(
      { role: "ADMIN" },
      { timeZone: "Europe/Berlin" },
    );
  });
});
