import "server-only";
import { prisma } from "@/lib/prisma";
import { holidayRuleSchema, type HolidayRule } from "./holiday-calendar";
import type {
  HolidayCatalogEntry,
  HolidayCatalogRepository,
} from "./holiday-catalog";
import type { HolidayCalendarRepository } from "./holiday-calendar";

function toRule(row: {
  ruleKind: "FIXED" | "NTH_WEEKDAY";
  month: number;
  day: number | null;
  weekday: number | null;
  occurrence: number | null;
}): HolidayRule {
  if (row.ruleKind === "FIXED" && row.day !== null) {
    return holidayRuleSchema.parse({
      kind: "FIXED",
      month: row.month,
      day: row.day,
    });
  }
  if (row.weekday !== null && row.occurrence !== null) {
    return holidayRuleSchema.parse({
      kind: "NTH_WEEKDAY",
      month: row.month,
      weekday: row.weekday,
      occurrence: row.occurrence,
    });
  }
  throw new Error("INVALID_HOLIDAY_RULE");
}

function toEntry(row: {
  id: string;
  name: string;
  ruleKind: "FIXED" | "NTH_WEEKDAY";
  month: number;
  day: number | null;
  weekday: number | null;
  occurrence: number | null;
  enabled: boolean;
  remindersEnabled: boolean;
  theme: "MALE" | "FEMALE" | null;
}): HolidayCatalogEntry {
  return {
    id: row.id,
    name: row.name,
    rule: toRule(row),
    enabled: row.enabled,
    remindersEnabled: row.remindersEnabled,
    theme: row.theme,
  };
}

function ruleData(rule: HolidayRule) {
  return rule.kind === "FIXED"
    ? {
        ruleKind: "FIXED" as const,
        month: rule.month,
        day: rule.day,
        weekday: null,
        occurrence: null,
      }
    : {
        ruleKind: "NTH_WEEKDAY" as const,
        month: rule.month,
        day: null,
        weekday: rule.weekday,
        occurrence: rule.occurrence,
      };
}

export const prismaHolidayCalendarRepository: HolidayCalendarRepository = {
  async listEnabledHolidays() {
    const rows = await prisma.holiday.findMany({
      where: { enabled: true },
      orderBy: [{ month: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      rule: toRule(row),
      theme: row.theme,
    }));
  },
  async listThematicCandidates(actorId) {
    const users = await prisma.user.findMany({
      where: {
        thematicHolidayConsent: true,
        gender: { not: null },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        gender: true,
        thematicHolidayConsent: true,
        lists: {
          where: {
            OR: [
              { userId: actorId },
              { viewers: { some: { userId: actorId } } },
            ],
          },
          select: { id: true, name: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      consent: user.thematicHolidayConsent,
      wishlists: user.lists,
    }));
  },
};

export const prismaHolidayCatalogRepository: HolidayCatalogRepository = {
  async list() {
    return (await prisma.holiday.findMany({ orderBy: [{ month: "asc" }, { name: "asc" }] }))
      .map(toEntry);
  },
  async create(input) {
    return toEntry(
      await prisma.holiday.create({
        data: {
          name: input.name,
          ...ruleData(input.rule),
          enabled: input.enabled,
          remindersEnabled: input.remindersEnabled,
          theme: input.theme,
        },
      }),
    );
  },
  async update(id, input) {
    return toEntry(
      await prisma.holiday.update({
        where: { id },
        data: {
          name: input.name,
          ...(input.rule ? ruleData(input.rule) : {}),
          enabled: input.enabled,
          remindersEnabled: input.remindersEnabled,
          theme: input.theme,
        },
      }),
    );
  },
};
