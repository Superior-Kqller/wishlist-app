import { randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export const SANTA_MIN_PARTICIPANTS = 3;

export interface SantaDrawInput {
  title: string;
  /** Дата обмена подарками, `YYYY-MM-DD`. */
  eventDate: string;
  budget: string | null;
  participantIds: string[];
}

/** Жеребьёвка глазами одного человека: чужих пар здесь нет и быть не должно. */
export interface SantaDrawView {
  id: string;
  title: string;
  eventDate: string;
  budget: string | null;
  organizerName: string;
  isOrganizer: boolean;
  participantCount: number;
  /** Кому дарит смотрящий; `null` — организатор сам не участвует. */
  receiver: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface SantaPair {
  giverId: string;
  receiverId: string;
}

/**
 * Перемешать и замкнуть в одно кольцо: каждый дарит следующему. Никто не
 * достаётся сам себе, и пары «друг другу» при трёх и более участниках исключены.
 */
export function drawPairs(ids: string[], pick: (max: number) => number = randomInt): SantaPair[] {
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((giverId, i) => ({ giverId, receiverId: order[(i + 1) % order.length] }));
}

export function createSanta(prisma: PrismaClient) {
  return {
    /** Создать жеребьёвку и сразу раздать пары. Бросает `SANTA_TOO_FEW` / `SANTA_UNKNOWN_PARTICIPANT`. */
    async create(organizerId: string, input: SantaDrawInput) {
      const ids = [...new Set(input.participantIds)];
      if (ids.length < SANTA_MIN_PARTICIPANTS) throw new Error("SANTA_TOO_FEW");
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });
      if (users.length !== ids.length) throw new Error("SANTA_UNKNOWN_PARTICIPANT");

      const pairs = drawPairs(ids);
      const draw = await prisma.santaDraw.create({
        data: {
          title: input.title,
          eventDate: input.eventDate,
          budget: input.budget,
          organizerId,
          assignments: { createMany: { data: pairs } },
        },
        select: { id: true, title: true, eventDate: true, budget: true },
      });
      const names = new Map(users.map((user) => [user.id, user.name]));
      return {
        ...draw,
        pairs: pairs.map((pair) => ({ ...pair, receiverName: names.get(pair.receiverId)! })),
      };
    },

    async listFor(userId: string): Promise<SantaDrawView[]> {
      const draws = await prisma.santaDraw.findMany({
        where: { OR: [{ organizerId: userId }, { assignments: { some: { giverId: userId } } }] },
        orderBy: [{ eventDate: "asc" }, { id: "asc" }],
        select: {
          id: true,
          title: true,
          eventDate: true,
          budget: true,
          organizerId: true,
          organizer: { select: { name: true } },
          _count: { select: { assignments: true } },
          // Только своя пара: остальные не покидают базу.
          assignments: {
            where: { giverId: userId },
            select: { receiver: { select: { id: true, name: true, avatarUrl: true } } },
          },
        },
      });
      return draws.map((draw) => ({
        id: draw.id,
        title: draw.title,
        eventDate: draw.eventDate,
        budget: draw.budget,
        organizerName: draw.organizer.name,
        isOrganizer: draw.organizerId === userId,
        participantCount: draw._count.assignments,
        receiver: draw.assignments[0]?.receiver ?? null,
      }));
    },

    /** Отменить жеребьёвку может только организатор. */
    async remove(organizerId: string, id: string): Promise<boolean> {
      const { count } = await prisma.santaDraw.deleteMany({ where: { id, organizerId } });
      return count > 0;
    },
  };
}
