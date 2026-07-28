import { getCurrentUserWithDbCheck } from "@/lib/auth-utils";
import { holidayCatalog } from "@/lib/calendar/prisma-holiday-catalog";
import { createHolidayHandlers } from "./holiday-handler";

const handlers = createHolidayHandlers({
  getActor: getCurrentUserWithDbCheck,
  catalog: holidayCatalog,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
