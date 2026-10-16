import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { PageShell } from "@/components/PageShell";
import { OrderForm, type OrderItemView } from "./order-form";

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  const [categories, s] = await Promise.all([getMenu(), getSettings()]);
  const items: OrderItemView[] = categories.flatMap((c) =>
    c.items.map((i) => ({ id: i.id, name: i.name, price: i.priceKopecks, available: i.available, category: c.name })),
  );

  return (
    <PageShell title="Заказ">
      <OrderForm items={items} delivery={{ enabled: s.deliveryEnabled, feeKopecks: s.deliveryFeeKopecks }} />
    </PageShell>
  );
}
