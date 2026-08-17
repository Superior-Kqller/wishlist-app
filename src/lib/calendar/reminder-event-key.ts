import type { CalendarEventSourceType } from "./calendar-events";

/*
 * Ключ заглушённого события — один формат на клиента и сервер.
 *
 * Раньше строка `TYPE:id` собиралась в четырёх местах независимо: трижды на
 * сервере одинаково и один раз в календаре, где идентификатор праздника ещё и
 * вытаскивался из составного `id` через split. Совпадение держалось на том,
 * что имена источников случайно одинаковы с обеих сторон, — и разъехалось бы
 * молча: заглушка просто перестала бы находиться, а напоминание пришло бы
 * человеку, который его выключил. Формат живёт здесь.
 */
export function reminderEventKey(event: {
  sourceType: CalendarEventSourceType;
  sourceId: string;
}): string {
  return `${event.sourceType}:${event.sourceId}`;
}

/** Тот же ключ со стороны календаря, где источник назван `type`. */
export function occurrenceReminderKey(occurrence: {
  type: CalendarEventSourceType;
  sourceId: string;
}): string {
  return reminderEventKey({ sourceType: occurrence.type, sourceId: occurrence.sourceId });
}
