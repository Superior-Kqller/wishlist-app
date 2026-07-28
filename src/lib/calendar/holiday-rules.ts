import { z } from "zod";
import { formatLocalDate, isValidCalendarDate } from "./local-date";

export const holidayRuleSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("FIXED"),
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
    })
    .refine((rule) => isValidCalendarDate(2028, rule.month, rule.day), {
      message: "INVALID_FIXED_DATE",
    }),
  z.object({
    kind: z.literal("NTH_WEEKDAY"),
    month: z.number().int().min(1).max(12),
    weekday: z.number().int().min(0).max(6),
    occurrence: z.union([
      z.literal(-1),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
  }),
]);

export type HolidayRule = z.infer<typeof holidayRuleSchema>;

export function dateForHolidayRule(rule: HolidayRule, year: number): string {
  if (rule.kind === "FIXED") {
    return formatLocalDate(year, rule.month, rule.day);
  }

  if (rule.occurrence > 0) {
    const firstWeekday = new Date(Date.UTC(year, rule.month - 1, 1)).getUTCDay();
    const day =
      1 + ((rule.weekday - firstWeekday + 7) % 7) + (rule.occurrence - 1) * 7;
    return formatLocalDate(year, rule.month, day);
  }

  const lastDay = new Date(Date.UTC(year, rule.month, 0)).getUTCDate();
  const lastWeekday = new Date(Date.UTC(year, rule.month - 1, lastDay)).getUTCDay();
  const day = lastDay - ((lastWeekday - rule.weekday + 7) % 7);
  return formatLocalDate(year, rule.month, day);
}
