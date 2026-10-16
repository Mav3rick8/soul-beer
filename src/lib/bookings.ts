import { createHash, randomBytes } from "node:crypto";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify, staffMaxIds } from "@/lib/notify";
import { AppError } from "@/lib/errors";
import { isPhoneVerified, normalizePhone } from "@/lib/phone";
import { getSettings, isWithinHours } from "@/lib/settings";

const MIN = 60_000;
const TZ = process.env.BAR_TZ ?? "Europe/Moscow";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const fmt = (d: Date) =>
  d.toLocaleString("ru-RU", { timeZone: TZ, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

async function notifyStaff(text: string, kind: string) {
  for (const to of await staffMaxIds()) await notify("MAX", to, text, kind);
}

/** Гость отправляет заявку. Стол назначает сотрудник при подтверждении. */
export async function createBooking(input: {
  startsAt: Date;
  guests: number;
  name: string;
  phone: string;
  comment?: string;
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new AppError("INVALID_PHONE", 400);
  if (input.startsAt.getTime() < Date.now()) throw new AppError("PAST_TIME", 400);
  if (!isWithinHours(input.startsAt, await getSettings())) throw new AppError("OUTSIDE_HOURS", 400);
  if (!(await isPhoneVerified(phone))) throw new AppError("PHONE_NOT_VERIFIED", 403);

  const booking = await prisma.booking.create({
    data: {
      code: randomBytes(3).toString("hex").toUpperCase(),
      startsAt: input.startsAt,
      guests: input.guests,
      name: input.name,
      phone,
      comment: input.comment,
    },
  });

  // Имя и телефон гостя в мессенджер не отправляем, только номер и время.
  await notifyStaff(`Новая заявка #${booking.code}: ${booking.guests} гост., ${fmt(booking.startsAt)}`, "staff_new_booking");
  return { code: booking.code };
}

/**
 * Сотрудник подтверждает заявку и назначает стол.
 * Проверяем пересечение с другими бронями на этом столе в транзакции уровня Serializable.
 */
export async function confirmBooking(bookingId: string, tableId: string, staffId: string) {
  const cancelToken = randomBytes(24).toString("base64url");

  const booking = await prisma.$transaction(
    async (tx) => {
      const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
      if (b.status !== BookingStatus.NEW) throw new AppError("NOT_NEW", 409);

      const table = await tx.table.findUniqueOrThrow({ where: { id: tableId } });
      if (!table.active || table.capacity < b.guests) throw new AppError("TABLE_TOO_SMALL", 409);

      const start = b.startsAt.getTime();
      const end = start + b.durationMin * MIN;
      // Брони длиной до 12 часов, поэтому ищем начавшиеся не раньше чем за 12 часов.
      const others = await tx.booking.findMany({
        where: {
          tableId,
          id: { not: bookingId },
          status: { in: [BookingStatus.NEW, BookingStatus.CONFIRMED] },
          startsAt: { gte: new Date(start - 12 * 60 * MIN), lt: new Date(end) },
        },
      });
      if (others.some((o) => o.startsAt.getTime() + o.durationMin * MIN > start)) {
        throw new AppError("TABLE_BUSY", 409);
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          tableId,
          confirmedById: staffId,
          cancelTokenHash: sha256(cancelToken),
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  const link = `${process.env.APP_URL}/cancel/${cancelToken}`;
  await notify(
    "SMS",
    booking.phone,
    `Soul Beer: бронь #${booking.code} подтверждена, ${fmt(booking.startsAt)}. Отмена или изменение: ${link}`,
    "guest_booking_confirmed",
  );
  return booking;
}

/** Гость отменяет бронь по ссылке из SMS. */
export async function cancelByToken(token: string) {
  const b = await prisma.booking.findUnique({ where: { cancelTokenHash: sha256(token) } });
  if (!b || b.status !== BookingStatus.CONFIRMED) throw new AppError("NOT_FOUND", 404);

  await prisma.booking.update({ where: { id: b.id }, data: { status: BookingStatus.CANCELLED } });
  await notifyStaff(`Бронь #${b.code} отменена гостем`, "staff_booking_cancelled");
  return { code: b.code };
}
