import type { HolidayRule } from "./holiday-calendar";

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
  update(
    id: string,
    input: Partial<Omit<HolidayCatalogEntry, "id">>,
  ): Promise<HolidayCatalogEntry>;
}

export interface HolidayActor {
  role: "USER" | "ADMIN";
}

function requireAdmin(actor: HolidayActor) {
  if (actor.role !== "ADMIN") throw new Error("FORBIDDEN");
}

export async function createHoliday(
  repository: HolidayCatalogRepository,
  actor: HolidayActor,
  input: Omit<HolidayCatalogEntry, "id">,
) {
  requireAdmin(actor);
  return repository.create(input);
}

export async function updateHoliday(
  repository: HolidayCatalogRepository,
  actor: HolidayActor,
  id: string,
  input: Partial<Omit<HolidayCatalogEntry, "id">>,
) {
  requireAdmin(actor);
  return repository.update(id, input);
}
