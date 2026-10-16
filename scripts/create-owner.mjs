// Создание первого владельца. Запуск (Node 20.6+):
// node --env-file=.env scripts/create-owner.mjs 79001234567 "пароль не короче 8 символов" "Имя"
import { randomBytes, scrypt } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const [rawPhone, password, name = "Владелец"] = process.argv.slice(2);

let phone = (rawPhone ?? "").replace(/\D/g, "");
if (phone.length === 11 && phone[0] === "8") phone = "7" + phone.slice(1);

if (!/^7\d{10}$/.test(phone) || !password || password.length < 8) {
  console.error("Нужны телефон (7XXXXXXXXXX) и пароль не короче 8 символов");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const key = await new Promise((resolve, reject) =>
  scrypt(password, salt, 64, (err, k) => (err ? reject(err) : resolve(k))),
);

const prisma = new PrismaClient();
await prisma.staff.create({
  data: { name, phone, passwordHash: `${salt}:${key.toString("hex")}`, role: "OWNER" },
});
await prisma.$disconnect();
console.log(`Владелец «${name}» создан, телефон ${phone}`);
