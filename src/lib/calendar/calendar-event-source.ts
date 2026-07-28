import type { HolidayRule } from "./holiday-rules";
import type {
  CalendarAudience,
  PersonalEventRecurrence,
} from "./personal-events";

export interface CalendarPersonSource {
  id: string;
  name: string;
  avatarUrl: string | null;
  birthdayDay: number | null;
  birthdayMonth: number | null;
  birthdayAudience: CalendarAudience;
  birthdayViewerIds: string[];
  gender: "MALE" | "FEMALE" | null;
  thematicHolidayConsent: boolean;
}

export interface CalendarPersonalEventSource {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  date: string;
  recurrence: PersonalEventRecurrence;
  audience: CalendarAudience;
  viewerIds: string[];
}

export interface CalendarHolidaySource {
  id: string;
  name: string;
  rule: HolidayRule;
  remindersEnabled: boolean;
  theme: "MALE" | "FEMALE" | null;
}

export interface CalendarWishlistSource {
  id: string;
  name: string;
  ownerId: string;
  viewerIds: string[];
}

export interface CalendarEventSource {
  listPeople(): Promise<CalendarPersonSource[]>;
  listPersonalEvents(): Promise<CalendarPersonalEventSource[]>;
  listEnabledHolidays(): Promise<CalendarHolidaySource[]>;
  listWishlistsAccessibleBy(userIds: string[]): Promise<CalendarWishlistSource[]>;
}
