import type { PrismaClient } from "@prisma/client";
import type {
  HolidayCatalogEntry,
  HolidayCatalogRepository,
} from "./holiday-catalog";
import {
  holidayRuleSchema,
  type HolidayRule,
} from "./holiday-rules";

function toRule(row: {
  ruleKind: "FIXED" | "NTH_WEEKDAY";
  month: number;
  day: number | null;
  weekday: number | null;
  occurrence: number | null;
}): HolidayRule {
  return holidayRuleSchema.parse(
    row.ruleKind === "FIXED"
      ? { kind: "FIXED", month: row.month, day: row.day }
      : {
          kind: "NTH_WEEKDAY",
          month: row.month,
          weekday: row.weekday,
          occurrence: row.occurrence,
        },
  );
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

export function createPrismaHolidayCatalogRepository(
  prisma: PrismaClient,
): HolidayCatalogRepository {
  return {
    async list() {
      return (
        await prisma.holiday.findMany({
          orderBy: [{ month: "asc" }, { name: "asc" }],
        })
      ).map(toEntry);
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
}
