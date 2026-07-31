import { getCurrentUserWithDbCheck } from "@/lib/auth-utils";
import { createCalendarInstallationSettings } from "@/lib/calendar/installation-settings";
import { prismaCalendarInstallationSettingsRepository } from "@/lib/calendar/prisma-installation-settings-repository";
import { createCalendarSettingsHandlers } from "./settings-handler";

const settings = createCalendarInstallationSettings(prismaCalendarInstallationSettingsRepository);
const handlers = createCalendarSettingsHandlers({
  getActor: getCurrentUserWithDbCheck,
  getSettings: settings.get,
  updateSettings: settings.update,
});

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
