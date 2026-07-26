import { NextResponse } from "next/server";
import { z } from "zod";
import { holidayRuleSchema } from "@/lib/calendar/holiday-calendar";
import type { HolidayActor, HolidayCatalogRepository } from "@/lib/calendar/holiday-catalog";
import { createHoliday, updateHoliday } from "@/lib/calendar/holiday-catalog";

const holidaySchema = z.object({
  name: z.string().trim().min(1).max(120),
  rule: holidayRuleSchema,
  enabled: z.boolean(),
  remindersEnabled: z.boolean(),
  theme: z.enum(["MALE", "FEMALE"]).nullable(),
});

interface Dependencies {
  getActor(): Promise<HolidayActor | null>;
  repository: HolidayCatalogRepository;
}

function accessResponse(actor: HolidayActor | null) {
  if (!actor) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  if (actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }
  return null;
}

export function createHolidayHandlers(dependencies: Dependencies) {
  return {
    GET: async () => {
      const actor = await dependencies.getActor();
      const denied = accessResponse(actor);
      if (denied) return denied;
      return NextResponse.json({ holidays: await dependencies.repository.list() });
    },
    POST: async (request: Request) => {
      const actor = await dependencies.getActor();
      const denied = accessResponse(actor);
      if (denied) return denied;
      const parsed = holidaySchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ error: "Ошибка проверки данных" }, { status: 400 });
      }
      const holiday = await createHoliday(dependencies.repository, actor!, parsed.data);
      return NextResponse.json(holiday, { status: 201 });
    },
    PATCH: async (request: Request, id: string) => {
      const actor = await dependencies.getActor();
      const denied = accessResponse(actor);
      if (denied) return denied;
      const body = await request.json();
      const parsed = holidaySchema.partial().safeParse(body);
      if (!parsed.success || Object.keys(parsed.data).length === 0) {
        return NextResponse.json({ error: "Ошибка проверки данных" }, { status: 400 });
      }
      return NextResponse.json(
        await updateHoliday(dependencies.repository, actor!, id, parsed.data),
      );
    },
  };
}
