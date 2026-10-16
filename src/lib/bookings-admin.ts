import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { AppError } from "@/lib/errors";

const TZ = process.env.BAR_TZ ?? "Europe/Moscow";

export const fmtDate = (d: Date) =>
  d.toLocaleString("ru-RU", { timeZone: TZ, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export async function listBookings() {
  const [pending, upcoming] = await Promise.all([
    prisma.booking.findMany({ where: { status: BookingStatus.NEW }, orderBy: { startsAt: "asc" } }),
    prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED, startsAt: { gte: new Date(Date.now() - 6 * 3600_000) } },
      include: { table: true },
      orderBy: { startsAt: "asc" },
      take: 50,
    }),
  ]);
  return { pending, upcoming };
}

export async function rejectBooking(bookingId: string) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b || b.status !== BookingStatus.NEW) throw new AppError("NOT_NEW", 409);

  await prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.REJECTED } });
  await notify(
    "SMS",
    b.phone,
    `Soul Beer: заявку #${b.code} не смогли подтвердить. Попробуйте выбрать другое время.`,
    "guest_booking_rejected",
  );
}
