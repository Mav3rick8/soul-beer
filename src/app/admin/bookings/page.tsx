import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { confirmBooking } from "@/lib/bookings";
import { fmtDate, listBookings, rejectBooking } from "@/lib/bookings-admin";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const ERRORS: Record<string, string> = {
  TABLE_BUSY: "Стол уже занят в это время. Выберите другой стол.",
  TABLE_TOO_SMALL: "За этим столом не хватит мест.",
  NOT_NEW: "Заявка уже обработана.",
};

const button = "bg-brick px-5 py-2 font-display text-cream disabled:opacity-50";
const select = "border border-cream/30 bg-ink px-3 py-2 text-cream";

export default async function BookingsPage({ searchParams }: { searchParams: { error?: string } }) {
  await requireStaff();
  const [{ pending, upcoming }, tables] = await Promise.all([
    listBookings(),
    prisma.table.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  async function confirmAction(formData: FormData) {
    "use server";
    const staff = await requireStaff();
    try {
      await confirmBooking(String(formData.get("bookingId")), String(formData.get("tableId")), staff.id);
    } catch (e) {
      if (e instanceof AppError) redirect(`/admin/bookings?error=${e.code}`);
      throw e;
    }
    revalidatePath("/admin/bookings");
  }

  async function rejectAction(formData: FormData) {
    "use server";
    await requireStaff();
    try {
      await rejectBooking(String(formData.get("bookingId")));
    } catch (e) {
      if (e instanceof AppError) redirect(`/admin/bookings?error=${e.code}`);
      throw e;
    }
    revalidatePath("/admin/bookings");
  }

  return (
    <>
      <h1 className="font-display text-4xl">Новые заявки</h1>
      {searchParams.error && (
        <p role="alert" className="mt-6 text-brick-light">
          {ERRORS[searchParams.error] ?? "Не удалось выполнить действие."}
        </p>
      )}
      {tables.length === 0 && (
        <p className="mt-6 text-mist">Столов пока нет. Добавьте их через npx prisma studio.</p>
      )}
      {pending.length === 0 && <p className="mt-6 text-mist">Новых заявок нет.</p>}

      <ul className="mt-6 grid gap-4">
        {pending.map((b) => (
          <li key={b.id} className="border border-cream/15 p-5">
            <p className="font-display text-2xl">
              #{b.code} · {b.guests} гост.
            </p>
            <p className="text-mist">{fmtDate(b.startsAt)}</p>
            <p>
              {b.name}, {b.phone}
            </p>
            {b.comment && <p className="text-cream/70">{b.comment}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={confirmAction} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="bookingId" value={b.id} />
                <select name="tableId" required defaultValue="" className={select}>
                  <option value="" disabled>
                    Выберите стол
                  </option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}, {t.zone}, до {t.capacity} мест
                    </option>
                  ))}
                </select>
                <button className={button} disabled={tables.length === 0}>
                  Подтвердить
                </button>
              </form>
              <form action={rejectAction}>
                <input type="hidden" name="bookingId" value={b.id} />
                <button className="border border-cream/30 px-5 py-2 text-cream">Отклонить</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 font-display text-3xl">Ближайшие брони</h2>
      {upcoming.length === 0 && <p className="mt-4 text-mist">Подтверждённых броней нет.</p>}
      <ul className="mt-4 grid gap-2">
        {upcoming.map((b) => (
          <li key={b.id} className="text-cream/85">
            #{b.code} · {fmtDate(b.startsAt)} · {b.table?.name ?? "без стола"} · {b.guests} гост. · {b.name}, {b.phone}
          </li>
        ))}
      </ul>
    </>
  );
}
