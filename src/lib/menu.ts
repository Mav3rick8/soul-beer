import { prisma } from "@/lib/prisma";

/** Категории с позициями. Недоступные позиции (стоп-лист) возвращаются с флагом available = false. */
export async function getMenu() {
  return prisma.menuCategory.findMany({
    orderBy: { sort: "asc" },
    include: { items: { orderBy: { sort: "asc" } } },
  });
}
