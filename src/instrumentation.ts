export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { startProductionCalendarReminderRunner } =
    await import("@/lib/calendar/production-reminder-runner");
  startProductionCalendarReminderRunner();
}
