import Link from "next/link";
import { getMenu } from "@/lib/menu";
import { rub } from "@/lib/money";
import { PageShell } from "@/components/PageShell";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await getMenu();

  return (
    <PageShell title="Меню">
      {categories.length === 0 && <p className="mt-6 text-mist">Меню пока пустое.</p>}

      {categories.map((c) => (
        <section key={c.id} className="mt-12">
          <h2 className="font-display text-3xl uppercase tracking-wide text-honey">{c.name}</h2>
          <ul className="mt-4 divide-y divide-cream/10 border-y border-cream/10">
            {c.items.map((i) => (
              <li key={i.id} className={`flex justify-between gap-4 py-4 ${i.available ? "" : "opacity-50"}`}>
                <div>
                  <p className="text-lg">{i.name}</p>
                  {i.description && <p className="text-sm text-mist">{i.description}</p>}
                </div>
                <p className="shrink-0 text-right font-display text-xl">
                  {i.available ? rub(i.priceKopecks) : <span className="font-body text-base text-mist">нет в наличии</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Link href="/order" className="btn-primary mt-12">
        Оформить заказ
      </Link>
    </PageShell>
  );
}
