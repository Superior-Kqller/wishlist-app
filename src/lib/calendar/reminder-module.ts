import { parseLocalDate } from "./local-date";
import type { CalendarEventSourceType, CalendarRange, ReminderEventFact } from "./calendar-events";
import { reminderEventKey } from "./reminder-event-key";

export type CalendarReminderSourceType = CalendarEventSourceType;
export type CalendarReminderCheckpoint = 30 | 21 | 7 | 0;

export type CalendarReminderEvent = ReminderEventFact;

export interface CalendarReminderRecipient {
  id: string;
  telegramId: string | null;
  telegramNotificationsEnabled: boolean;
  calendarNotificationsEnabled: boolean;
  mutedEventKeys: string[];
}

export interface CalendarReminderDelivery {
  recipientId: string;
  sourceType: CalendarReminderSourceType;
  sourceId: string;
  occurrenceDate: string;
  checkpointDays: CalendarReminderCheckpoint;
}

export interface CalendarReminderRepository {
  listEligibleRecipients(userIds: string[]): Promise<CalendarReminderRecipient[]>;
  claimDelivery(delivery: CalendarReminderDelivery): Promise<boolean>;
  releaseDelivery(delivery: CalendarReminderDelivery): Promise<void>;
}

export interface CalendarReminderEventSource {
  reminderFacts(range: CalendarRange): Promise<ReminderEventFact[]>;
}

export interface CalendarTelegramAdapter {
  send(message: { chatId: string; text: string }): Promise<void>;
}

export interface CalendarReminderLogger {
  deliveryError(
    error: unknown,
    context: {
      sourceType: CalendarReminderSourceType;
      checkpointDays: CalendarReminderCheckpoint;
    },
  ): void;
}

const CHECKPOINTS: CalendarReminderCheckpoint[] = [30, 21, 7, 0];

function addDays(localDate: string, days: number): string {
  const parsed = parseLocalDate(localDate);
  if (!parsed) throw new Error("INVALID_LOCAL_DATE");
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): CalendarReminderCheckpoint | null {
  const fromDate = Date.parse(`${from}T00:00:00Z`);
  const toDate = Date.parse(`${to}T00:00:00Z`);
  const days = (toDate - fromDate) / 86_400_000;
  return CHECKPOINTS.includes(days as CalendarReminderCheckpoint)
    ? (days as CalendarReminderCheckpoint)
    : null;
}

function formatMessage(
  event: CalendarReminderEvent,
  recipientId: string,
  checkpoint: CalendarReminderCheckpoint,
  publicBaseUrl: string,
): string {
  const baseUrl = publicBaseUrl.replace(/\/+$/, "");
  const remaining =
    checkpoint === 0 ? "сегодня" : `через ${checkpoint} ${checkpoint === 21 ? "день" : "дней"}`;
  const lines = [`📅 ${event.title}`, `Дата: ${event.occurrenceDate}`, `Осталось: ${remaining}`];
  if (event.congratulated.length > 0) {
    lines.push(`Поздравляем: ${event.congratulated.join(", ")}`);
  }
  lines.push(`Календарь: ${baseUrl}/calendar`);
  for (const wishlist of event.wishlistLinksByRecipient[recipientId] ?? []) {
    lines.push(`${wishlist.label}: ${new URL(wishlist.href, `${baseUrl}/`).toString()}`);
  }
  return lines.join("\n");
}

export function createCalendarReminderModule(
  eventSource: CalendarReminderEventSource,
  repository: CalendarReminderRepository,
  telegram: CalendarTelegramAdapter,
  logger?: CalendarReminderLogger,
) {
  return {
    async processDueReminders(input: {
      localDate: string;
      publicBaseUrl: string;
    }): Promise<{ sent: number; failed: number }> {
      if (!parseLocalDate(input.localDate)) throw new Error("INVALID_LOCAL_DATE");
      const rangeEnd = addDays(input.localDate, 30);
      const events = await eventSource.reminderFacts({
        rangeStart: input.localDate,
        rangeEnd,
      });
      let sent = 0;
      let failed = 0;

      for (const event of events) {
        const checkpoint = daysBetween(input.localDate, event.occurrenceDate);
        if (checkpoint === null) continue;
        const recipients = await repository.listEligibleRecipients(event.audienceUserIds);
        const eventKey = reminderEventKey(event);

        for (const recipient of recipients) {
          if (
            !recipient.telegramId ||
            !recipient.telegramNotificationsEnabled ||
            !recipient.calendarNotificationsEnabled ||
            recipient.mutedEventKeys.includes(eventKey) ||
            event.excludedRecipientIds.includes(recipient.id)
          ) {
            continue;
          }

          const delivery: CalendarReminderDelivery = {
            recipientId: recipient.id,
            sourceType: event.sourceType,
            sourceId: event.sourceId,
            occurrenceDate: event.occurrenceDate,
            checkpointDays: checkpoint,
          };
          if (!(await repository.claimDelivery(delivery))) continue;

          try {
            await telegram.send({
              chatId: recipient.telegramId,
              text: formatMessage(event, recipient.id, checkpoint, input.publicBaseUrl),
            });
            sent += 1;
          } catch (error) {
            failed += 1;
            logger?.deliveryError(error, {
              sourceType: delivery.sourceType,
              checkpointDays: delivery.checkpointDays,
            });
            await repository.releaseDelivery(delivery);
          }
        }
      }
      return { sent, failed };
    },
  };
}
