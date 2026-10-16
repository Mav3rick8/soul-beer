import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { AppError } from "@/lib/errors";

const CODE_TTL_MS = 5 * 60_000;
const MAX_CODES_PER_HOUR = 3;
const MAX_ATTEMPTS = 5;
const VERIFIED_FOR_MS = 30 * 24 * 3600_000;

/** Приводим номер к виду 7XXXXXXXXXX, иначе null. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && (d[0] === "8" || d[0] === "7")) d = "7" + d.slice(1);
  else if (d.length === 10) d = "7" + d;
  return /^7\d{10}$/.test(d) ? d : null;
}

function hmac(value: string): string {
  const secret = process.env.CODE_SECRET;
  if (!secret) throw new Error("CODE_SECRET не задан");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function requestCode(raw: string): Promise<void> {
  const phone = normalizePhone(raw);
  if (!phone) throw new AppError("INVALID_PHONE", 400);

  const recent = await prisma.phoneVerification.count({
    where: { phone, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recent >= MAX_CODES_PER_HOUR) throw new AppError("TOO_MANY_CODES", 429);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.phoneVerification.create({
    data: {
      phone,
      codeHash: hmac(`${phone}:${code}`),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  await notify("SMS", phone, `Код подтверждения Soul Beer: ${code}`, "sms_code");
}

export async function confirmCode(raw: string, code: string): Promise<void> {
  const phone = normalizePhone(raw);
  if (!phone) throw new AppError("INVALID_PHONE", 400);

  const pending = await prisma.phoneVerification.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!pending || pending.attempts >= MAX_ATTEMPTS) {
    throw new AppError("CODE_EXPIRED_OR_LOCKED", 400);
  }

  const ok = timingSafeEqual(
    Buffer.from(pending.codeHash),
    Buffer.from(hmac(`${phone}:${code}`)),
  );
  if (!ok) {
    await prisma.phoneVerification.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AppError("WRONG_CODE", 400);
  }

  await prisma.$transaction([
    prisma.phoneVerification.deleteMany({ where: { phone } }),
    prisma.verifiedPhone.upsert({
      where: { phone },
      create: { phone, verifiedAt: new Date() },
      update: { verifiedAt: new Date() },
    }),
  ]);
}

/** Телефон подтверждён кодом в течение последних 30 дней. */
export async function isPhoneVerified(phone: string): Promise<boolean> {
  const v = await prisma.verifiedPhone.findUnique({ where: { phone } });
  return !!v && Date.now() - v.verifiedAt.getTime() < VERIFIED_FOR_MS;
}
