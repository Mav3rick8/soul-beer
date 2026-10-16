import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { btn, btnLine, card, heading, input } from "../styles";

export const dynamic = "force-dynamic";

const MANAGERS: ("OWNER" | "ADMIN" | "HOST")[] = ["OWNER", "ADMIN"];
const ZONES: Record<string, string> = { bar: "Бар", hall: "Зал", sofa: "Диван" };

/** Общая проверка полей стола. Возвращает данные или null, если ввод некорректен. */
function parseTable(fd: FormData) {
  const name = String(fd.get("name") ?? "").trim();
  const zone = String(fd.get("zone") ?? "");
  const capacity = Number(fd.get("capacity"));
  if (!name || !(zone in ZONES) || !Number.isInteger(capacity) || capacity < 1 || capacity > 50) return null;
  return { name, zone, capacity };
}

async function addTable(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const data = parseTable(fd);
  if (!data) return;
  await prisma.table.create({ data: { ...data, active: true } });
  revalidatePath("/admin/tables");
}

async function updateTable(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const data = parseTable(fd);
  if (!data) return;
  await prisma.table.update({ where: { id: String(fd.get("id")) }, data });
  revalidatePath("/admin/tables");
}

async function toggleTable(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const id = String(fd.get("id"));
  const t = await prisma.table.findUniqueOrThrow({ where: { id } });
  await prisma.table.update({ where: { id }, data: { active: !t.active } });
  revalidatePath("/admin/tables");
}

export default async function TablesAdminPage() {
  await requireStaff(MANAGERS);
  const tables = await prisma.table.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <h1 className={heading}>Столы</h1>

      <form action={addTable} className={`${card} mt-8 grid max-w-2xl gap-3 md:grid-cols-2`}>
        <p className="font-display text-xl md:col-span-2">Новый стол</p>
        <input name="name" required placeholder="Например, Бар 1" className={input} />
        <select name="zone" required className={input} aria-label="Зона">
          {Object.entries(ZONES).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <input name="capacity" type="number" min={1} max={50} required placeholder="Мест" className={input} />
        <button className={btn}>Добавить стол</button>
      </form>

      <ul className="mt-10 grid gap-4">
        {tables.map((t) => (
          <li key={t.id} className="border-b border-cream/10 pb-4">
            <form action={updateTable} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={t.id} />
              <input name="name" required defaultValue={t.name} aria-label="Название стола" className={`${input} w-44`} />
              <select name="zone" defaultValue={t.zone} aria-label="Зона" className={input}>
                {Object.entries(ZONES).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <input name="capacity" type="number" min={1} max={50} required defaultValue={t.capacity} aria-label="Мест" className={`${input} w-24`} />
              <button className={btnLine}>Сохранить</button>
            </form>
            <form action={toggleTable} className="mt-2">
              <input type="hidden" name="id" value={t.id} />
              <button className="text-sm text-mist underline">
                {t.active ? "Убрать из работы" : "Вернуть в работу"}
              </button>
            </form>
          </li>
        ))}
      </ul>
      {tables.length === 0 && <p className="mt-8 text-mist">Столов пока нет.</p>}
    </>
  );
}
