export const DEFAULT_CALENDAR_TIME_ZONE = "Europe/Moscow";

export interface CalendarInstallationSettingsRepository {
  get(): Promise<{ timeZone: string }>;
  save(timeZone: string): Promise<{ timeZone: string }>;
}

export interface CalendarSettingsActor {
  role: "USER" | "ADMIN";
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function createCalendarInstallationSettings(
  repository: CalendarInstallationSettingsRepository,
) {
  return {
    get: () => repository.get(),
    async update(
      actor: CalendarSettingsActor,
      input: { timeZone: string },
    ): Promise<{ timeZone: string }> {
      if (actor.role !== "ADMIN") throw new Error("FORBIDDEN");
      const timeZone = input.timeZone.trim();
      if (!isValidIanaTimeZone(timeZone)) throw new Error("INVALID_TIME_ZONE");
      return repository.save(timeZone);
    },
  };
}
