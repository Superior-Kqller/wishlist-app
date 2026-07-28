import "server-only";
import { prisma } from "@/lib/prisma";
import { createHolidayCatalog } from "./holiday-catalog";
import { createPrismaHolidayCatalogRepository } from "./prisma-holiday-catalog-repository";

export const holidayCatalog = createHolidayCatalog(
  createPrismaHolidayCatalogRepository(prisma),
);
