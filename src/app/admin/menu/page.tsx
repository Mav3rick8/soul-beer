import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { toKopecks } from "@/lib/money";
import { btn, btnLine, card, heading, input } from "../styles";

export const dynamic = "force-dynamic";

const MANAGERS: ("OWNER" | "ADMIN" | "HOST")[] = ["OWNER", "ADMIN"];

function refresh() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/order");
}

async function addCategory(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  await prisma.menuCategory.create({ data: { name, sort: Number(fd.get("sort")) || 0 } });
  refresh();
}

async function addItem(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const name = String(fd.get("name") ?? "").trim();
  const price = toKopecks(String(fd.get("price") ?? ""));
  if (!name || price === null) return;
  await prisma.menuItem.create({
    data: {
      categoryId: String(fd.get("categoryId")),
      name,
      description: String(fd.get("description") ?? "").trim() || null,
      priceKopecks: price,
      sort: Number(fd.get("sort")) || 0,
    },
  });
  refresh();
}

async function setPrice(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const price = toKopecks(String(fd.get("price") ?? ""));
  if (price === null) return;
  await prisma.menuItem.update({ where: { id: String(fd.get("id")) }, data: { priceKopecks: price } });
  refresh();
}

async function toggleStop(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const id = String(fd.get("id"));
  const item = await prisma.menuItem.findUniqueOrThrow({ where: { id } });
  await prisma.menuItem.update({ where: { id }, data: { available: !item.available } });
  refresh();
}

export default async function MenuAdminPage() {
  await requireStaff(MANAGERS);
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: "asc" },
    include: { items: { orderBy: { sort: "asc" } } },
  });

  return (
    <>
      <h1 className={heading}>Меню</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <form action={addCategory} className={`${card} grid gap-3`}>
          <p className="font-display text-xl">Новая категория</p>
          <input name="name" required placeholder="Например, Пиво" className={input} />
          <input name="sort" type="number" placeholder="Порядок" className={input} />
          <button className={btn}>Добавить категорию</button>
        </form>

        <form action={addItem} className={`${card} grid gap-3`}>
          <p className="font-display text-xl">Новая позиция</p>
          <select name="categoryId" required className={input}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="name" required placeholder="Название" className={input} />
          <input name="description" placeholder="Описание: стиль, крепость, состав" className={input} />
          <input name="price" required inputMode="decimal" placeholder="Цена, ₽" className={input} />
          <input name="sort" type="number" placeholder="Порядок" className={input} />
          <button className={btn} disabled={categories.length === 0}>Добавить позицию</button>
        </form>
      </div>

      {categories.map((c) => (
        <section key={c.id} className="mt-12">
          <h2 className="font-display text-3xl text-honey">{c.name}</h2>
          <ul className="mt-4 grid gap-3">
            {c.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/10 pb-3">
                <div className={i.available ? "" : "text-mist line-through"}>
                  <p>{i.name}</p>
                  {i.description && <p className="text-sm text-mist">{i.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <form action={setPrice} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <input
                      name="price"
                      required
                      inputMode="decimal"
                      defaultValue={i.priceKopecks / 100}
                      aria-label={`Цена: ${i.name}`}
                      className={`${input} w-24`}
                    />
                    <button className={btnLine}>Сохранить</button>
                  </form>
                  <form action={toggleStop}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className={btnLine}>{i.available ? "В стоп-лист" : "Вернуть в продажу"}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
