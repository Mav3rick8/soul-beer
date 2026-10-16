// Только для локальной проверки, пока SMS не подключены: отмечает телефон подтверждённым на 30 дней,
// чтобы оформить бронь или заказ без кода. Запуск: npm.cmd run verify-phone -- 79001234567
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production" || process.env.SMS_ENABLED === "true") {
  console.error("Скрипт работает только локально и пока SMS выключены");
  process.exit(1);
}

let phone = (process.argv[2] ?? "").replace(/\D/g, "");
if (phone.length === 11 && phone[0] === "8") phone = "7" + phone.slice(1);
else if (phone.length === 10) phone = "7" + phone;

if (!/^7\d{10}$/.test(phone)) {
  console.error("Нужен телефон в формате 7XXXXXXXXXX");
  process.exit(1);
}

const prisma = new PrismaClient();
await prisma.verifiedPhone.upsert({
  where: { phone },
  create: { phone, verifiedAt: new Date() },
  update: { verifiedAt: new Date() },
});
await prisma.$disconnect();
console.log(`Телефон ${phone} отмечен подтверждённым на 30 дней`);
