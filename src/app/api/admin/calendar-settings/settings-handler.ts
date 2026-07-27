import { NextResponse } from "next/server";
import type { CalendarSettingsActor } from "@/lib/calendar/installation-settings";

interface Dependencies {
  getActor(): Promise<CalendarSettingsActor | null>;
  getSettings(): Promise<{ timeZone: string }>;
  updateSettings(
    actor: CalendarSettingsActor,
    input: { timeZone: string },
  ): Promise<{ timeZone: string }>;
}

function deny(actor: CalendarSettingsActor | null) {
  if (!actor) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  if (actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }
  return null;
}

export function createCalendarSettingsHandlers(dependencies: Dependencies) {
  return {
    GET: async () => {
      const actor = await dependencies.getActor();
      const denied = deny(actor);
      return denied ?? NextResponse.json(await dependencies.getSettings());
    },
    PATCH: async (request: Request) => {
      const actor = await dependencies.getActor();
      const denied = deny(actor);
      if (denied) return denied;
      const body = (await request.json()) as { timeZone?: unknown };
      if (typeof body.timeZone !== "string") {
        return NextResponse.json({ error: "Некорректная временная зона" }, { status: 400 });
      }
      try {
        return NextResponse.json(
          await dependencies.updateSettings(actor!, { timeZone: body.timeZone }),
        );
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_TIME_ZONE") {
          return NextResponse.json(
            { error: "Укажите валидную IANA-временную зону" },
            { status: 400 },
          );
        }
        throw error;
      }
    },
  };
}
