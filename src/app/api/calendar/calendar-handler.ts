import { NextResponse } from "next/server";
import type { CalendarOccurrence, CalendarRange } from "@/lib/calendar/calendar-events";
import { sanitizeError } from "@/lib/logger";
import { parseLocalDate } from "@/lib/calendar/local-date";

interface CalendarGetDependencies {
  getActorId(): Promise<string | null>;
  calendarFor(actorId: string, range: CalendarRange): Promise<CalendarOccurrence[]>;
}

export function createCalendarGetHandler(dependencies: CalendarGetDependencies) {
  return async function calendarGet(request: Request): Promise<Response> {
    const actorId = await dependencies.getActorId();
    if (!actorId) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeStart = searchParams.get("from");
    const rangeEnd = searchParams.get("to");
    if (
      !rangeStart ||
      !rangeEnd ||
      !parseLocalDate(rangeStart) ||
      !parseLocalDate(rangeEnd) ||
      rangeStart > rangeEnd
    ) {
      return NextResponse.json({ error: "Некорректный диапазон дат" }, { status: 400 });
    }

    try {
      const occurrences = await dependencies.calendarFor(actorId, {
        rangeStart,
        rangeEnd,
      });
      return NextResponse.json({ occurrences });
    } catch (error) {
      sanitizeError("Calendar query error", error, { actorId });
      return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
    }
  };
}
