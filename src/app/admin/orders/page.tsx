import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/session";
import { moveOrder } from "@/lib/orders";
import { fmtDate } from "@/lib/bookings-admin";
import { rub } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Кнопки по текущему статусу
const NEXT: Record<string, { to: OrderStatus; label: string; outline?: boolean }[]> = {
  NEW: [
    { to: "CONFIRMED", label: "Подтвердить" },
    { to: "CANCELLED", label: "Отклонить", outline: true },
  ],
  CONFIRMED: [{ to: "READY", label: "Готов" }],
  READY: [{ to: "COMPLETED", label: "Выдан" }],
};

async function changeStatus(formData: FormData) {
  "use server";
  await requireStaff();
  await moveOrder(
    String(formData.get("orderId")),
    String(formData.get("from")) as OrderStatus,
    String(formData.get("to")) as OrderStatus,
  );
  revalidatePath("/admin/orders");
}

export default async function OrdersPage() {
  await requireStaff();
  const orders = await prisma.order.findMany({
    where: { status: { in: ["NEW", "CONFIRMED", "READY"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <h1 className="font-display text-4xl">Заказы</h1>
      {orders.length === 0 && <p className="mt-6 text-mist">Активных заказов нет.</p>}

      <ul className="mt-6 grid gap-4">
        {orders.map((o) => (
          <li key={o.id} className="border border-cream/15 p-5">
            <p className="font-display text-2xl">
              #{o.code} · {({ PICKUP: "самовывоз", TABLE: "к столу", DELIVERY: "доставка" } as Record<string, string>)[o.type]} · {rub(o.totalKopecks)}
            </p>
            {o.pickupAt && <p className="text-mist">Выдача: {fmtDate(o.pickupAt)}</p>}
            <p>{o.name}, {o.phone}</p>
            {o.address && <p className="text-cream/85">Адрес: {o.address}</p>}
            <p className="text-cream/85">{o.items.map((i) => `${i.nameSnapshot} × ${i.quantity}`).join(", ")}</p>
            {o.comment && <p className="text-cream/70">{o.comment}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              {(NEXT[o.status] ?? []).map((a) => (
                <form key={a.to} action={changeStatus}>
                  <input type="hidden" name="orderId" value={o.id} />
                  <input type="hidden" name="from" value={o.status} />
                  <input type="hidden" name="to" value={a.to} />
                  <button className={a.outline ? "border border-cream/30 px-5 py-2" : "bg-brick px-5 py-2 font-display"}>
                    {a.label}
                  </button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
