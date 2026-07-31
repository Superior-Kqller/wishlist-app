import { NextResponse } from "next/server";
import type { HolidayActor, HolidayCatalog } from "@/lib/calendar/holiday-catalog";

interface Dependencies {
  getActor(): Promise<HolidayActor | null>;
  catalog: HolidayCatalog;
}

function unauthorized(actor: HolidayActor | null) {
  if (!actor) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  return null;
}

function domainError(error: unknown) {
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }
  if (error instanceof Error && error.message === "INVALID_HOLIDAY") {
    return NextResponse.json({ error: "Ошибка проверки данных" }, { status: 400 });
  }
  throw error;
}

export function createHolidayHandlers(dependencies: Dependencies) {
  return {
    GET: async () => {
      const actor = await dependencies.getActor();
      const denied = unauthorized(actor);
      if (denied) return denied;
      try {
        return NextResponse.json({
          holidays: await dependencies.catalog.list(actor!),
        });
      } catch (error) {
        return domainError(error);
      }
    },
    POST: async (request: Request) => {
      const actor = await dependencies.getActor();
      const denied = unauthorized(actor);
      if (denied) return denied;
      try {
        const holiday = await dependencies.catalog.create(actor!, await request.json());
        return NextResponse.json(holiday, { status: 201 });
      } catch (error) {
        return domainError(error);
      }
    },
    PATCH: async (request: Request, id: string) => {
      const actor = await dependencies.getActor();
      const denied = unauthorized(actor);
      if (denied) return denied;
      try {
        return NextResponse.json(
          await dependencies.catalog.update(actor!, id, await request.json()),
        );
      } catch (error) {
        return domainError(error);
      }
    },
  };
}
