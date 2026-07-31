import { z } from "zod";
import { holidayRuleSchema, type HolidayRule } from "./holiday-rules";

export interface HolidayCatalogEntry {
  id: string;
  name: string;
  rule: HolidayRule;
  enabled: boolean;
  remindersEnabled: boolean;
  theme: "MALE" | "FEMALE" | null;
}

export interface HolidayCatalogRepository {
  list(): Promise<HolidayCatalogEntry[]>;
  create(input: Omit<HolidayCatalogEntry, "id">): Promise<HolidayCatalogEntry>;
  update(id: string, input: Partial<Omit<HolidayCatalogEntry, "id">>): Promise<HolidayCatalogEntry>;
}

export interface HolidayActor {
  role: "USER" | "ADMIN";
}

const holidayInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rule: holidayRuleSchema,
  enabled: z.boolean(),
  remindersEnabled: z.boolean(),
  theme: z.enum(["MALE", "FEMALE"]).nullable(),
});

const holidayUpdateSchema = holidayInputSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);

function requireAdmin(actor: HolidayActor): void {
  if (actor.role !== "ADMIN") throw new Error("FORBIDDEN");
}

function parseInput(input: unknown): Omit<HolidayCatalogEntry, "id"> {
  const parsed = holidayInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_HOLIDAY");
  return parsed.data;
}

function parseUpdate(input: unknown): Partial<Omit<HolidayCatalogEntry, "id">> {
  const parsed = holidayUpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_HOLIDAY");
  return parsed.data;
}

export function createHolidayCatalog(repository: HolidayCatalogRepository) {
  return {
    async list(actor: HolidayActor): Promise<HolidayCatalogEntry[]> {
      requireAdmin(actor);
      return repository.list();
    },

    async create(actor: HolidayActor, input: unknown): Promise<HolidayCatalogEntry> {
      requireAdmin(actor);
      return repository.create(parseInput(input));
    },

    async update(actor: HolidayActor, id: string, input: unknown): Promise<HolidayCatalogEntry> {
      requireAdmin(actor);
      return repository.update(id, parseUpdate(input));
    },
  };
}

export type HolidayCatalog = ReturnType<typeof createHolidayCatalog>;
