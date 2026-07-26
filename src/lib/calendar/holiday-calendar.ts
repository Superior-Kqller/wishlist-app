import { formatLocalDate, parseLocalDate } from "./local-date";
import { z } from "zod";
import { isValidCalendarDate } from "./local-date";
import type { ProfileGender } from "./profile-gender";

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

export interface HolidayCalendarSource {
  id: string;
  name: string;
  rule: HolidayRule;
  theme: ProfileGender | null;
}

export interface VisibleWishlistSummary {
  id: string;
  name: string;
}

export interface ThematicHolidayCandidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  gender: ProfileGender | null;
  consent: boolean;
  wishlists: VisibleWishlistSummary[];
}

export interface HolidayCalendarRepository {
  listEnabledHolidays(): Promise<HolidayCalendarSource[]>;
  listThematicCandidates(actorId: string): Promise<ThematicHolidayCandidate[]>;
}

export interface HolidayOccurrence {
  id: string;
  type: "HOLIDAY";
  date: string;
  name: string;
  congratulated: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    wishlists: VisibleWishlistSummary[];
  }>;
}

export interface CalendarRangeQuery {
  actorId: string;
  rangeStart: string;
  rangeEnd: string;
}

function dateForRule(rule: HolidayRule, year: number): string {
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
  const day =
    lastDay -
    ((lastWeekday - rule.weekday + 7) % 7) -
    (Math.abs(rule.occurrence) - 1) * 7;
  return formatLocalDate(year, rule.month, day);
}

export async function listHolidayOccurrences(
  repository: HolidayCalendarRepository,
  query: CalendarRangeQuery,
): Promise<HolidayOccurrence[]> {
  const start = parseLocalDate(query.rangeStart);
  const end = parseLocalDate(query.rangeEnd);
  if (!start || !end || query.rangeStart > query.rangeEnd) {
    throw new Error("INVALID_DATE_RANGE");
  }

  const holidays = await repository.listEnabledHolidays();
  const thematicCandidates = holidays.some((holiday) => holiday.theme !== null)
    ? await repository.listThematicCandidates(query.actorId)
    : [];
  const occurrences: HolidayOccurrence[] = [];
  for (const holiday of holidays) {
    for (let year = start.year; year <= end.year; year += 1) {
      const date = dateForRule(holiday.rule, year);
      if (date < query.rangeStart || date > query.rangeEnd) continue;
      occurrences.push({
        id: `holiday:${holiday.id}:${date}`,
        type: "HOLIDAY",
        date,
        name: holiday.name,
        congratulated:
          holiday.theme === null
            ? []
            : thematicCandidates
                .filter(
                  (candidate) =>
                    candidate.consent && candidate.gender === holiday.theme,
                )
                .map(({ id, name, avatarUrl, wishlists }) => ({
                  id,
                  name,
                  avatarUrl,
                  wishlists,
                })),
      });
    }
  }
  return occurrences.sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.name.localeCompare(right.name, "ru"),
  );
}
