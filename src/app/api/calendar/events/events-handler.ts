import { NextResponse } from "next/server";
import { z } from "zod";
import type { PersonalEventInput, PersonalEventRecord } from "@/lib/calendar/calendar-module";
import { sanitizeError } from "@/lib/logger";

const personalEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().default(null),
  date: z.iso.date(),
  recurrence: z.enum(["ONCE", "YEARLY"]),
  audience: z.enum(["ALL", "SELECTED", "PRIVATE"]),
  selectedViewerIds: z.array(z.string().min(1)).max(200).default([]),
}).superRefine((event, context) => {
  if (event.audience !== "SELECTED" && event.selectedViewerIds.length > 0) {
    context.addIssue({
      code: "custom",
      path: ["selectedViewerIds"],
      message: "Выбранные пользователи допустимы только для выбранной аудитории",
    });
  }
});

type EventContext = { params: Promise<{ id: string }> };

const unauthorized = () =>
  NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
const invalidInput = (error: z.ZodError) =>
  NextResponse.json(
    { error: "Ошибка проверки данных", details: error.issues },
    { status: 400 },
  );

interface EventsDependencies {
  getActorId(): Promise<string | null>;
  listOwnPersonalEvents(actorId: string): Promise<PersonalEventRecord[]>;
  createPersonalEvent(actorId: string, input: PersonalEventInput): Promise<PersonalEventRecord>;
}

export function createPersonalEventsHandlers(dependencies: EventsDependencies) {
  return {
    async GET(): Promise<Response> {
      const actorId = await dependencies.getActorId();
      if (!actorId) return unauthorized();
      try {
        return NextResponse.json({
          events: await dependencies.listOwnPersonalEvents(actorId),
        });
      } catch (error) {
        sanitizeError("List personal calendar events error", error, { actorId });
        return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
      }
    },
    async POST(request: Request): Promise<Response> {
      const actorId = await dependencies.getActorId();
      if (!actorId) return unauthorized();
      try {
        const input = personalEventSchema.parse(await request.json());
        const event = await dependencies.createPersonalEvent(actorId, input);
        return NextResponse.json({ event }, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return invalidInput(error);
        if (error instanceof Error && error.message === "INVALID_EVENT_VIEWERS") {
          return NextResponse.json({ error: "Некорректная аудитория события" }, { status: 400 });
        }
        sanitizeError("Create personal calendar event error", error, { actorId });
        return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
      }
    },
  };
}

interface EventItemDependencies {
  getActorId(): Promise<string | null>;
  updatePersonalEvent(
    actorId: string,
    id: string,
    input: PersonalEventInput,
  ): Promise<PersonalEventRecord | null>;
  deletePersonalEvent(actorId: string, id: string): Promise<boolean>;
}

export function createPersonalEventItemHandlers(dependencies: EventItemDependencies) {
  return {
    async PATCH(request: Request, context: EventContext): Promise<Response> {
      const actorId = await dependencies.getActorId();
      if (!actorId) return unauthorized();
      const { id } = await context.params;
      try {
        const input = personalEventSchema.parse(await request.json());
        const event = await dependencies.updatePersonalEvent(actorId, id, input);
        return event
          ? NextResponse.json({ event })
          : NextResponse.json({ error: "Событие не найдено" }, { status: 404 });
      } catch (error) {
        if (error instanceof z.ZodError) return invalidInput(error);
        if (error instanceof Error && error.message === "INVALID_EVENT_VIEWERS") {
          return NextResponse.json({ error: "Некорректная аудитория события" }, { status: 400 });
        }
        sanitizeError("Update personal calendar event error", error, { actorId, eventId: id });
        return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
      }
    },
    async DELETE(_request: Request, context: EventContext): Promise<Response> {
      const actorId = await dependencies.getActorId();
      if (!actorId) return unauthorized();
      const { id } = await context.params;
      try {
        const deleted = await dependencies.deletePersonalEvent(actorId, id);
        return deleted
          ? NextResponse.json({ success: true })
          : NextResponse.json({ error: "Событие не найдено" }, { status: 404 });
      } catch (error) {
        sanitizeError("Delete personal calendar event error", error, { actorId, eventId: id });
        return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
      }
    },
  };
}
