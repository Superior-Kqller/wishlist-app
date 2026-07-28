import "server-only";
import { prisma } from "@/lib/prisma";
import { createPersonalEvents } from "./personal-events";
import { createPrismaPersonalEventRepository } from "./prisma-personal-event-repository";

export const personalEvents = createPersonalEvents(
  createPrismaPersonalEventRepository(prisma),
);
