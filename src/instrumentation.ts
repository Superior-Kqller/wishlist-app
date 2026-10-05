export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { startProductionCalendarReminderRunner } = await import("@/lib/calendar/prisma-calendar");
  startProductionCalendarReminderRunner();

  const { startTelegramBot } = await import("@/lib/telegram/client");
  const { handleTelegramUpdate } = await import("@/lib/telegram/actions");
  void startTelegramBot(process.env.NEXTAUTH_URL, handleTelegramUpdate);
}
