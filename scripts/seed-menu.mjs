// Заглушки меню для проверки страниц /menu и /order. Запуск:
// node --env-file=.env scripts/seed-menu.mjs
// Названия и цены заменить на реальные в npx prisma studio.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

if ((await prisma.menuCategory.count()) > 0) {
  console.log("Меню уже есть, заглушки не добавлялись");
} else {
  await prisma.menuCategory.create({
    data: {
      name: "Пиво",
      sort: 1,
      items: {
        create: [
          { name: "[Сорт 1]", description: "[стиль, крепость]", priceKopecks: 35000, sort: 1 },
          { name: "[Сорт 2]", description: "[стиль, крепость]", priceKopecks: 38000, sort: 2 },
        ],
      },
    },
  });
  await prisma.menuCategory.create({
    data: {
      name: "Закуски",
      sort: 2,
      items: {
        create: [{ name: "[Блюдо 1]", description: "[состав]", priceKopecks: 49000, sort: 1 }],
      },
    },
  });
  console.log("Заглушки меню добавлены");
}

await prisma.$disconnect();
