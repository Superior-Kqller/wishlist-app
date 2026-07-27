import { describe, expect, it, vi } from "vitest";
import {
  createAutomaticReminderRunner,
  startAutomaticReminderRunner,
} from "./automatic-reminder-runner";

describe("automatic calendar reminder runner", () => {
  it("не запускает обработку до 10:00 локального времени установки", async () => {
    const processDueReminders = vi.fn();
    const runner = createAutomaticReminderRunner({
      getTimeZone: vi.fn().mockResolvedValue("Europe/Moscow"),
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    });

    await runner.tick(new Date("2027-01-10T06:59:00Z"));

    expect(processDueReminders).not.toHaveBeenCalled();
  });

  it("после 10:00 передаёт локальную календарную дату установки", async () => {
    const processDueReminders = vi.fn().mockResolvedValue({ sent: 1, failed: 0 });
    const runner = createAutomaticReminderRunner({
      getTimeZone: vi.fn().mockResolvedValue("America/New_York"),
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    });

    await runner.tick(new Date("2027-01-11T15:15:00Z"));

    expect(processDueReminders).toHaveBeenCalledWith({
      localDate: "2027-01-11",
      publicBaseUrl: "https://wishlist.example",
    });
  });

  it("после перезапуска догоняет только текущий день и полагается на идемпотентность модуля", async () => {
    const processDueReminders = vi.fn().mockResolvedValue({ sent: 0, failed: 0 });
    const dependencies = {
      getTimeZone: vi.fn().mockResolvedValue("Europe/Moscow"),
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    };
    const now = new Date("2027-01-11T08:00:00Z");

    await createAutomaticReminderRunner(dependencies).tick(now);
    await createAutomaticReminderRunner(dependencies).tick(now);

    expect(processDueReminders).toHaveBeenCalledTimes(2);
    expect(processDueReminders).toHaveBeenNthCalledWith(2, {
      localDate: "2027-01-11",
      publicBaseUrl: "https://wishlist.example",
    });
  });

  it("не запускает один процесс повторно в ту же локальную дату", async () => {
    const processDueReminders = vi.fn().mockResolvedValue({ sent: 0, failed: 0 });
    const runner = createAutomaticReminderRunner({
      getTimeZone: vi.fn().mockResolvedValue("Europe/Moscow"),
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    });

    await runner.tick(new Date("2027-01-11T07:00:00Z"));
    await runner.tick(new Date("2027-01-11T18:00:00Z"));

    expect(processDueReminders).toHaveBeenCalledOnce();
  });

  it("повторяет текущий день после временной ошибки доставки", async () => {
    const processDueReminders = vi
      .fn()
      .mockResolvedValueOnce({ sent: 0, failed: 1 })
      .mockResolvedValueOnce({ sent: 1, failed: 0 });
    const runner = createAutomaticReminderRunner({
      getTimeZone: vi.fn().mockResolvedValue("Europe/Moscow"),
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    });
    const now = new Date("2027-01-11T08:00:00Z");

    await runner.tick(now);
    await runner.tick(now);

    expect(processDueReminders).toHaveBeenCalledTimes(2);
  });

  it("не обрабатывает более раннюю дату после смены временной зоны", async () => {
    const getTimeZone = vi
      .fn()
      .mockResolvedValueOnce("Pacific/Kiritimati")
      .mockResolvedValueOnce("Pacific/Honolulu");
    const processDueReminders = vi.fn().mockResolvedValue({ sent: 0, failed: 0 });
    const runner = createAutomaticReminderRunner({
      getTimeZone,
      processDueReminders,
      publicBaseUrl: "https://wishlist.example",
    });
    const now = new Date("2027-01-11T21:00:00Z");

    await runner.tick(now);
    await runner.tick(now);

    expect(processDueReminders).toHaveBeenCalledOnce();
  });

  it("автоматически запускает адаптер без реального ожидания времени", async () => {
    vi.useFakeTimers();
    const processDueReminders = vi.fn().mockResolvedValue({ sent: 0, failed: 0 });
    const stop = startAutomaticReminderRunner(
      {
        getTimeZone: vi.fn().mockResolvedValue("Europe/Moscow"),
        processDueReminders,
        publicBaseUrl: "https://wishlist.example",
      },
      60_000,
    );
    vi.setSystemTime(new Date("2027-01-11T08:00:00Z"));

    await vi.advanceTimersByTimeAsync(10_000);

    expect(processDueReminders).toHaveBeenCalledOnce();
    stop();
    vi.useRealTimers();
  });
});
