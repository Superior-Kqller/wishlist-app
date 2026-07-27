import { describe, expect, it, vi } from "vitest";
import {
  createCalendarInstallationSettings,
  type CalendarInstallationSettingsRepository,
} from "./installation-settings";

function repository(
  timeZone = "Europe/Moscow",
): CalendarInstallationSettingsRepository {
  return {
    get: vi.fn().mockResolvedValue({ timeZone }),
    save: vi.fn(async (nextTimeZone) => ({ timeZone: nextTimeZone })),
  };
}

describe("calendar installation settings", () => {
  it("возвращает начальную временную зону установки", async () => {
    const settings = createCalendarInstallationSettings(repository());

    await expect(settings.get()).resolves.toEqual({ timeZone: "Europe/Moscow" });
  });

  it("разрешает менять временную зону только администратору", async () => {
    const repo = repository();
    const settings = createCalendarInstallationSettings(repo);

    await expect(
      settings.update({ role: "USER" }, { timeZone: "Europe/Berlin" }),
    ).rejects.toThrow("FORBIDDEN");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("сохраняет только валидную IANA-временную зону", async () => {
    const repo = repository();
    const settings = createCalendarInstallationSettings(repo);

    await expect(
      settings.update({ role: "ADMIN" }, { timeZone: "Not/A_Zone" }),
    ).rejects.toThrow("INVALID_TIME_ZONE");
    await expect(
      settings.update({ role: "ADMIN" }, { timeZone: "America/New_York" }),
    ).resolves.toEqual({ timeZone: "America/New_York" });
    await expect(
      settings.update({ role: "ADMIN" }, { timeZone: "UTC" }),
    ).resolves.toEqual({ timeZone: "UTC" });
  });
});
