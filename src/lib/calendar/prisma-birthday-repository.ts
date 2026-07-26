import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  BirthdayCalendarRepository,
  BirthdayCalendarSource,
} from "./birthday-calendar";

export const prismaBirthdayCalendarRepository: BirthdayCalendarRepository = {
  async listBirthdays(): Promise<BirthdayCalendarSource[]> {
    const users = await prisma.user.findMany({
      where: {
        birthdayDay: { not: null },
        birthdayMonth: { not: null },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        birthdayDay: true,
        birthdayMonth: true,
        birthdayYear: true,
        birthdayAudience: true,
        birthdayViewers: {
          select: { viewerId: true },
        },
      },
    });

    return users.flatMap((user) =>
      user.birthdayDay !== null && user.birthdayMonth !== null
        ? [
            {
              userId: user.id,
              name: user.name,
              avatarUrl: user.avatarUrl,
              day: user.birthdayDay,
              month: user.birthdayMonth,
              year: user.birthdayYear,
              audience: user.birthdayAudience,
              selectedViewerIds: user.birthdayViewers.map((entry) => entry.viewerId),
            },
          ]
        : [],
    );
  },
};
