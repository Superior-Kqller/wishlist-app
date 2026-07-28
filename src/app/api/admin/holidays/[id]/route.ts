import { getCurrentUserWithDbCheck } from "@/lib/auth-utils";
import { holidayCatalog } from "@/lib/calendar/prisma-holiday-catalog";
import { createHolidayHandlers } from "../holiday-handler";

const handlers = createHolidayHandlers({
  getActor: getCurrentUserWithDbCheck,
  catalog: holidayCatalog,
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handlers.PATCH(request, id);
}
