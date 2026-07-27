interface AutomaticReminderRunnerDependencies {
  getTimeZone(): Promise<string>;
  processDueReminders(input: {
    localDate: string;
    publicBaseUrl: string;
  }): Promise<{ sent: number; failed: number }>;
  publicBaseUrl: string;
  onError?(error: unknown): void;
}

function localDateAndHour(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    localDate: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

export function createAutomaticReminderRunner(
  dependencies: AutomaticReminderRunnerDependencies,
) {
  let processedLocalDate: string | null = null;
  let running = false;

  return {
    async tick(now = new Date()): Promise<void> {
      if (running) return;
      running = true;
      try {
        const timeZone = await dependencies.getTimeZone();
        const { localDate, hour } = localDateAndHour(now, timeZone);
        if (hour < 10 || (processedLocalDate !== null && localDate <= processedLocalDate)) return;
        const result = await dependencies.processDueReminders({
          localDate,
          publicBaseUrl: dependencies.publicBaseUrl,
        });
        if (result.failed === 0) processedLocalDate = localDate;
      } catch (error) {
        dependencies.onError?.(error);
      } finally {
        running = false;
      }
    },
  };
}

export function startAutomaticReminderRunner(
  dependencies: AutomaticReminderRunnerDependencies,
  intervalMs = 60_000,
) {
  const runner = createAutomaticReminderRunner(dependencies);
  const initial = setTimeout(() => void runner.tick(), 10_000);
  const interval = setInterval(() => void runner.tick(), intervalMs);
  initial.unref();
  interval.unref();
  return () => {
    clearTimeout(initial);
    clearInterval(interval);
  };
}
