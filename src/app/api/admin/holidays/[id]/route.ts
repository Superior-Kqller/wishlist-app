import { getCurrentUserWithDbCheck } from "@/lib/auth-utils";
import { prismaHolidayCatalogRepository } from "@/lib/calendar/prisma-holiday-repository";
import { createHolidayHandlers } from "../holiday-handler";

const handlers = createHolidayHandlers({
  getActor: getCurrentUserWithDbCheck,
  repository: prismaHolidayCatalogRepository,
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handlers.PATCH(request, id);
}
