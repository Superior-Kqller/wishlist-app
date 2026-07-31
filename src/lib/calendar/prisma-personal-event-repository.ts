import type { PrismaClient } from "@prisma/client";
import type {
  PersonalEventInput,
  PersonalEventRecord,
  PersonalEventRepository,
} from "./personal-events";

const eventSelection = {
  id: true,
  ownerId: true,
  title: true,
  description: true,
  localDate: true,
  recurrence: true,
  audience: true,
  viewers: { select: { viewerId: true } },
} as const;

function toRecord(event: {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  localDate: string;
  recurrence: "ONCE" | "YEARLY";
  audience: "ALL" | "SELECTED" | "PRIVATE";
  viewers: { viewerId: string }[];
}): PersonalEventRecord {
  return {
    id: event.id,
    ownerId: event.ownerId,
    title: event.title,
    description: event.description,
    date: event.localDate,
    recurrence: event.recurrence,
    audience: event.audience,
    selectedViewerIds: event.viewers.map((viewer) => viewer.viewerId),
  };
}

function eventData(input: PersonalEventInput) {
  return {
    title: input.title,
    description: input.description,
    localDate: input.date,
    recurrence: input.recurrence,
    audience: input.audience,
  };
}

export function createPrismaPersonalEventRepository(prisma: PrismaClient): PersonalEventRepository {
  return {
    async findExistingUserIds(userIds) {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });
      return users.map((user) => user.id);
    },

    async listByOwner(ownerId) {
      const events = await prisma.personalEvent.findMany({
        where: { ownerId },
        select: eventSelection,
        orderBy: { localDate: "asc" },
      });
      return events.map(toRecord);
    },

    async create(event) {
      return toRecord(
        await prisma.personalEvent.create({
          data: {
            ownerId: event.ownerId,
            ...eventData(event),
            viewers: {
              create: event.selectedViewerIds.map((viewerId) => ({ viewerId })),
            },
          },
          select: eventSelection,
        }),
      );
    },

    async update(id, ownerId, event) {
      return prisma.$transaction(async (transaction) => {
        const existing = await transaction.personalEvent.findFirst({
          where: { id, ownerId },
          select: { id: true },
        });
        if (!existing) return null;
        await transaction.personalEventViewer.deleteMany({
          where: { eventId: id },
        });
        return toRecord(
          await transaction.personalEvent.update({
            where: { id },
            data: {
              ...eventData(event),
              viewers: {
                create: event.selectedViewerIds.map((viewerId) => ({ viewerId })),
              },
            },
            select: eventSelection,
          }),
        );
      });
    },

    async delete(id, ownerId) {
      const result = await prisma.personalEvent.deleteMany({
        where: { id, ownerId },
      });
      return result.count > 0;
    },
  };
}
