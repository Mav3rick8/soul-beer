import { randomBytes } from "node:crypto";
import { BookingStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify, staffMaxIds } from "@/lib/notify";
import { AppError } from "@/lib/errors";
import { isPhoneVerified, normalizePhone } from "@/lib/phone";
import { fmtDate } from "@/lib/bookings-admin";
import { rub } from "@/lib/money";
import { getSettings, isWithinHours } from "@/lib/settings";

export type OrderInput = {
  type: "PICKUP" | "TABLE" | "DELIVERY";
  name: string;
  phone: string;
  comment?: string;
  pickupAt?: Date;
  bookingCode?: string;
  address?: string;
  items: { menuItemId: string; quantity: number }[];
};

const LABEL = { PICKUP: "самовывоз", TABLE: "к столу", DELIVERY: "доставка" };

export async function createOrder(input: OrderInput) {
  const phone = normalizePhone(input.phone);
  if (!phone) throw new AppError("INVALID_PHONE", 400);
  if (!(await isPhoneVerified(phone))) throw new AppError("PHONE_NOT_VERIFIED", 403);
  const settings = await getSettings();

  // Цены и наличие берём из базы, а не от клиента
  const menu = await prisma.menuItem.findMany({ where: { id: { in: input.items.map((i) => i.menuItemId) } } });
  const lines = input.items.map((i) => {
    const m = menu.find((x) => x.id === i.menuItemId);
    if (!m || !m.available) throw new AppError("ITEM_UNAVAILABLE", 409);
    return { menuItemId: m.id, nameSnapshot: m.name, priceKopecks: m.priceKopecks, quantity: i.quantity };
  });
  let totalKopecks = lines.reduce((s, l) => s + l.priceKopecks * l.quantity, 0);

  let bookingId: string | undefined;
  let address: string | null = null;
  if (input.type === "TABLE") {
    // Предзаказ к столу привязываем к активной брони с тем же телефоном
    const b = await prisma.booking.findUnique({ where: { code: input.bookingCode ?? "" } });
    const active = b?.status === BookingStatus.NEW || b?.status === BookingStatus.CONFIRMED;
    if (!b || !active || b.phone !== phone) throw new AppError("BOOKING_NOT_FOUND", 404);
    bookingId = b.id;
  } else {
    if (!input.pickupAt || input.pickupAt.getTime() < Date.now()) throw new AppError("PAST_TIME", 400);
    if (!isWithinHours(input.pickupAt, settings)) throw new AppError("OUTSIDE_HOURS", 400);
    if (input.type === "DELIVERY") {
      if (!settings.deliveryEnabled) throw new AppError("DELIVERY_OFF", 409);
      address = input.address?.trim() || null;
      if (!address) throw new AppError("ADDRESS_REQUIRED", 400);
      totalKopecks += settings.deliveryFeeKopecks;
    }
  }

  const order = await prisma.order.create({
    data: {
      code: randomBytes(3).toString("hex").toUpperCase(),
      type: input.type,
      name: input.name,
      phone,
      comment: input.comment,
      pickupAt: input.pickupAt,
      address,
      totalKopecks,
      bookingId,
      items: { create: lines },
    },
  });

  // В мессенджер только номер, тип и сумма, без имени, телефона и адреса гостя
  const text = `Новый заказ #${order.code}: ${LABEL[input.type]}, ${rub(totalKopecks)}`;
  for (const to of await staffMaxIds()) await notify("MAX", to, text, "staff_new_order");
  return { code: order.code };
}

/** Переход статуса заказа. Из неверного состояния не переходит. Гостю уходит SMS. */
export async function moveOrder(orderId: string, from: OrderStatus, to: OrderStatus) {
  const res = await prisma.order.updateMany({ where: { id: orderId, status: from }, data: { status: to } });
  if (res.count === 0) throw new AppError("BAD_STATUS", 409);

  const o = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const texts: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: `Soul Beer: заказ #${o.code} принят${o.pickupAt ? `, время ${fmtDate(o.pickupAt)}` : ""}.`,
    READY: `Soul Beer: заказ #${o.code} готов.`,
    CANCELLED: `Soul Beer: заказ #${o.code} не приняли. Попробуйте выбрать другое время.`,
  };
  const text = texts[to];
  if (text) await notify("SMS", o.phone, text, `guest_order_${to.toLowerCase()}`);
}
