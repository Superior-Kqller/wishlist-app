import { parseLocalDate } from "./local-date";

export type CalendarAudience = "ALL" | "SELECTED" | "PRIVATE";
export type PersonalEventRecurrence = "ONCE" | "YEARLY";

export interface PersonalEventRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  date: string;
  recurrence: PersonalEventRecurrence;
  audience: CalendarAudience;
  selectedViewerIds: string[];
}

export type PersonalEventInput = Omit<PersonalEventRecord, "id" | "ownerId">;

export interface PersonalEventRepository {
  findExistingUserIds(userIds: string[]): Promise<string[]>;
  listByOwner(ownerId: string): Promise<PersonalEventRecord[]>;
  create(event: Omit<PersonalEventRecord, "id">): Promise<PersonalEventRecord>;
  update(
    id: string,
    ownerId: string,
    event: PersonalEventInput,
  ): Promise<PersonalEventRecord | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
}

function validateInput(input: PersonalEventInput): void {
  if (!input.title.trim() || input.title.length > 200) {
    throw new Error("INVALID_TITLE");
  }
  if (input.description !== null && input.description.length > 2000) {
    throw new Error("INVALID_DESCRIPTION");
  }
  if (!parseLocalDate(input.date)) throw new Error("INVALID_LOCAL_DATE");
  if (input.audience !== "SELECTED" && input.selectedViewerIds.length > 0) {
    throw new Error("INVALID_AUDIENCE");
  }
}

function normalizeInput(input: PersonalEventInput, actorId: string): PersonalEventInput {
  validateInput(input);
  return {
    ...input,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    selectedViewerIds: [...new Set(input.selectedViewerIds)].filter(
      (viewerId) => viewerId !== actorId,
    ),
  };
}

async function assertValidAudience(
  repository: PersonalEventRepository,
  input: PersonalEventInput,
): Promise<void> {
  if (input.selectedViewerIds.length === 0) return;
  const existingIds = await repository.findExistingUserIds(input.selectedViewerIds);
  if (existingIds.length !== input.selectedViewerIds.length) {
    throw new Error("INVALID_EVENT_VIEWERS");
  }
}

export function createPersonalEvents(repository: PersonalEventRepository) {
  return {
    listOwn(actorId: string): Promise<PersonalEventRecord[]> {
      return repository.listByOwner(actorId);
    },

    async create(actorId: string, input: PersonalEventInput): Promise<PersonalEventRecord> {
      const normalized = normalizeInput(input, actorId);
      await assertValidAudience(repository, normalized);
      return repository.create({ ...normalized, ownerId: actorId });
    },

    async update(
      actorId: string,
      id: string,
      input: PersonalEventInput,
    ): Promise<PersonalEventRecord | null> {
      const normalized = normalizeInput(input, actorId);
      await assertValidAudience(repository, normalized);
      return repository.update(id, actorId, normalized);
    },

    delete(actorId: string, id: string): Promise<boolean> {
      return repository.delete(id, actorId);
    },
  };
}

export type PersonalEvents = ReturnType<typeof createPersonalEvents>;
