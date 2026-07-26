import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  PersonalEventRecord,
  CalendarRepository,
  PersonalEventInput,
} from "./calendar-module";
import { prismaBirthdayCalendarRepository } from "./prisma-birthday-repository";

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

export const prismaCalendarRepository: CalendarRepository = {
  async findExistingUserIds(userIds) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    return users.map((user) => user.id);
  },

  listBirthdays: () => prismaBirthdayCalendarRepository.listBirthdays(),

  async listPersonalEvents() {
    return (await prisma.personalEvent.findMany({ select: eventSelection })).map(toRecord);
  },

  async createPersonalEvent(event) {
    const created = await prisma.personalEvent.create({
      data: {
        ownerId: event.ownerId,
        ...eventData(event),
        viewers: {
          create: event.selectedViewerIds.map((viewerId) => ({ viewerId })),
        },
      },
      select: eventSelection,
    });
    return toRecord(created);
  },

  async updatePersonalEvent(id, ownerId, event) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.personalEvent.findFirst({
        where: { id, ownerId },
        select: { id: true },
      });
      if (!existing) return null;
      await tx.personalEventViewer.deleteMany({ where: { eventId: id } });
      const updated = await tx.personalEvent.update({
        where: { id },
        data: {
          ...eventData(event),
          viewers: {
            create: event.selectedViewerIds.map((viewerId) => ({ viewerId })),
          },
        },
        select: eventSelection,
      });
      return toRecord(updated);
    });
  },

  async deletePersonalEvent(id, ownerId) {
    const result = await prisma.personalEvent.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  },
};
