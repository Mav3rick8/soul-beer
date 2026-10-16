import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { fmtDate } from "@/lib/bookings-admin";
import { prisma } from "@/lib/prisma";
import { btn, btnLine, card, heading, input } from "../styles";

export const dynamic = "force-dynamic";

const MANAGERS: ("OWNER" | "ADMIN" | "HOST")[] = ["OWNER", "ADMIN"];
// Часовой пояс бара, как на сайте брони и заказов.
const OFFSET = "+03:00";

function refresh() {
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

async function addEvent(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const title = String(fd.get("title") ?? "").trim();
  const date = String(fd.get("date") ?? "");
  const time = String(fd.get("time") ?? "");
  if (!title || !date || !time) return;
  const startsAt = new Date(`${date}T${time}:00${OFFSET}`);
  if (Number.isNaN(startsAt.getTime())) return;

  await prisma.event.create({
    data: {
      title,
      startsAt,
      description: String(fd.get("description") ?? "").trim() || null,
      published: fd.get("published") === "on",
    },
  });
  refresh();
}

async function togglePublished(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const id = String(fd.get("id"));
  const ev = await prisma.event.findUniqueOrThrow({ where: { id } });
  await prisma.event.update({ where: { id }, data: { published: !ev.published } });
  refresh();
}

async function deleteEvent(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  await prisma.event.delete({ where: { id: String(fd.get("id")) } });
  refresh();
}

export default async function EventsAdminPage() {
  await requireStaff(MANAGERS);
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" }, take: 100 });

  return (
    <>
      <h1 className={heading}>Афиша</h1>

      <form action={addEvent} className={`${card} mt-8 grid max-w-2xl gap-3 md:grid-cols-2`}>
        <p className="font-display text-xl md:col-span-2">Новое событие</p>
        <input name="title" required placeholder="Название" className={`${input} md:col-span-2`} />
        <input name="date" type="date" required aria-label="Дата" className={input} />
        <input name="time" type="time" step={1800} required aria-label="Время" className={input} />
        <textarea name="description" rows={2} placeholder="Описание" className={`${input} md:col-span-2`} />
        <label className="flex items-center gap-3 text-sm md:col-span-2">
          <input type="checkbox" name="published" className="accent-brick" />
          Сразу опубликовать на сайте
        </label>
        <button className={`${btn} md:col-span-2 md:justify-self-start`}>Добавить событие</button>
      </form>

      <ul className="mt-10 grid gap-4">
        {events.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/10 pb-4">
            <div>
              <p className="font-display text-xl">{e.title}</p>
              <p className="text-sm text-mist">
                {fmtDate(e.startsAt)} · {e.published ? "опубликовано" : "черновик"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={togglePublished}>
                <input type="hidden" name="id" value={e.id} />
                <button className={btnLine}>{e.published ? "Скрыть" : "Опубликовать"}</button>
              </form>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <button className="px-3 py-2 text-sm text-mist underline">Удалить</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      {events.length === 0 && <p className="mt-8 text-mist">Событий пока нет.</p>}
    </>
  );
}
