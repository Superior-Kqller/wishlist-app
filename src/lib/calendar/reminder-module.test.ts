import { describe, expect, it, vi } from "vitest";
import {
  createCalendarReminderModule,
  type CalendarReminderEvent,
  type CalendarReminderRepository,
} from "./reminder-module";

function event(overrides: Partial<CalendarReminderEvent> = {}): CalendarReminderEvent {
  return {
    sourceType: "PERSONAL",
    sourceId: "event-1",
    occurrenceDate: "2027-08-31",
    title: "Годовщина",
    audienceUserIds: ["owner", "friend"],
    excludedRecipientIds: [],
    congratulated: [],
    wishlistLinksByRecipient: {},
    remindersEnabled: true,
    ...overrides,
  };
}

function repository(events: CalendarReminderEvent[]): CalendarReminderRepository {
  const deliveries = new Set<string>();
  const deliveryKey = (delivery: {
    recipientId: string;
    sourceType: string;
    sourceId: string;
    occurrenceDate: string;
    checkpointDays: number;
  }) =>
    [
      delivery.recipientId,
      delivery.sourceType,
      delivery.sourceId,
      delivery.occurrenceDate,
      delivery.checkpointDays,
    ].join(":");
  return {
    listReminderEvents: vi.fn().mockResolvedValue(events),
    listEligibleRecipients: vi.fn(async (userIds) =>
      [
        {
          id: "owner",
          telegramId: "10001",
          telegramNotificationsEnabled: true,
          calendarNotificationsEnabled: true,
          mutedEventKeys: [],
        },
        {
          id: "friend",
          telegramId: "10002",
          telegramNotificationsEnabled: true,
          calendarNotificationsEnabled: true,
          mutedEventKeys: [],
        },
      ].filter((recipient) => userIds.includes(recipient.id)),
    ),
    claimDelivery: vi.fn(async (delivery) => {
      const key = deliveryKey(delivery);
      if (deliveries.has(key)) return false;
      deliveries.add(key);
      return true;
    }),
    releaseDelivery: vi.fn(async (delivery) => {
      deliveries.delete(deliveryKey(delivery));
    }),
  };
}

describe("calendar reminder module", () => {
  it.each([30, 21, 7, 0])(
    "отправляет напоминание в контрольной точке %i дней",
    async (checkpointDays) => {
      const repo = repository([event()]);
      const send = vi.fn().mockResolvedValue(undefined);
      const reminders = createCalendarReminderModule(repo, { send });

      await reminders.processDueReminders({
        localDate: `2027-08-${String(31 - checkpointDays).padStart(2, "0")}`,
        publicBaseUrl: "https://wishlist.example",
      });

      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[0][0].text).toContain("Годовщина");
      expect(send.mock.calls[0][0].text).toContain("https://wishlist.example/calendar");
    },
  );

  it("учитывает настройки, приглушение и исключения получателей", async () => {
    const repo = repository([
      event({
        sourceType: "BIRTHDAY",
        sourceId: "birthday-person",
        title: "День рождения Анны",
        audienceUserIds: ["birthday-person", "friend", "muted", "disabled"],
        excludedRecipientIds: ["birthday-person"],
        congratulated: ["Анна"],
      }),
    ]);
    repo.listEligibleRecipients = vi.fn().mockResolvedValue([
      {
        id: "birthday-person",
        telegramId: "10001",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        mutedEventKeys: [],
      },
      {
        id: "friend",
        telegramId: "10002",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        mutedEventKeys: [],
      },
      {
        id: "muted",
        telegramId: "10003",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        mutedEventKeys: ["BIRTHDAY:birthday-person"],
      },
      {
        id: "disabled",
        telegramId: "10004",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: false,
        mutedEventKeys: [],
      },
    ]);
    const send = vi.fn().mockResolvedValue(undefined);

    await createCalendarReminderModule(repo, { send }).processDueReminders({
      localDate: "2027-08-01",
      publicBaseUrl: "https://wishlist.example",
    });

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ chatId: "10002" }));
  });

  it("не дублирует доставку при повторном и конкурентном запуске", async () => {
    const repo = repository([event()]);
    const send = vi.fn().mockResolvedValue(undefined);
    const reminders = createCalendarReminderModule(repo, { send });
    const input = { localDate: "2027-08-01", publicBaseUrl: "https://wishlist.example" };

    await Promise.all([
      reminders.processDueReminders(input),
      reminders.processDueReminders(input),
    ]);

    expect(send).toHaveBeenCalledTimes(2);
  });

  it("новый зритель получает только ещё не наступившие контрольные точки", async () => {
    const repo = repository([event({ audienceUserIds: ["owner"] })]);
    const send = vi.fn().mockResolvedValue(undefined);
    const reminders = createCalendarReminderModule(repo, { send });

    await reminders.processDueReminders({
      localDate: "2027-08-01",
      publicBaseUrl: "https://wishlist.example",
    });
    repo.listReminderEvents = vi
      .fn()
      .mockResolvedValue([event({ audienceUserIds: ["owner", "new-viewer"] })]);
    repo.listEligibleRecipients = vi.fn().mockResolvedValue([
      {
        id: "new-viewer",
        telegramId: "10005",
        telegramNotificationsEnabled: true,
        calendarNotificationsEnabled: true,
        mutedEventKeys: [],
      },
    ]);
    await reminders.processDueReminders({
      localDate: "2027-08-10",
      publicBaseUrl: "https://wishlist.example",
    });

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toEqual(
      expect.objectContaining({ chatId: "10005" }),
    );
  });

  it("освобождает бронь доставки после ошибки Telegram для будущего повтора", async () => {
    const repo = repository([event({ audienceUserIds: ["owner"] })]);
    const send = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
    const deliveryError = vi.fn();
    const reminders = createCalendarReminderModule(repo, { send }, { deliveryError });
    const input = { localDate: "2027-08-01", publicBaseUrl: "https://wishlist.example" };

    await reminders.processDueReminders(input);
    await reminders.processDueReminders(input);

    expect(repo.releaseDelivery).toHaveBeenCalledOnce();
    expect(deliveryError).toHaveBeenCalledWith(expect.any(Error), {
      sourceType: "PERSONAL",
      checkpointDays: 30,
    });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
