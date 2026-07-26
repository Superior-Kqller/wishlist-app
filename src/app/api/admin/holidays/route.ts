import { getCurrentUserWithDbCheck } from "@/lib/auth-utils";
import { prismaHolidayCatalogRepository } from "@/lib/calendar/prisma-holiday-repository";
import { createHolidayHandlers } from "./holiday-handler";

const handlers = createHolidayHandlers({
  getActor: getCurrentUserWithDbCheck,
  repository: prismaHolidayCatalogRepository,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
