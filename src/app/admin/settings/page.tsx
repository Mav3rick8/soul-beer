import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/session";
import { toKopecks } from "@/lib/money";
import { getSettings, saveSettings } from "@/lib/settings";
import { btn, card, heading, input } from "../styles";

export const dynamic = "force-dynamic";

const MANAGERS: ("OWNER" | "ADMIN" | "HOST")[] = ["OWNER", "ADMIN"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

async function save(fd: FormData) {
  "use server";
  await requireStaff(MANAGERS);
  const open = String(fd.get("open") ?? "");
  const close = String(fd.get("close") ?? "");
  const fee = toKopecks(String(fd.get("fee") ?? "0"));
  if (!TIME.test(open) || !TIME.test(close) || fee === null) return;

  await saveSettings({
    open,
    close,
    deliveryEnabled: fd.get("deliveryEnabled") === "on",
    deliveryFeeKopecks: fee,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/order");
}

export default async function SettingsPage() {
  await requireStaff(MANAGERS);
  const s = await getSettings();

  return (
    <>
      <h1 className={heading}>Настройки</h1>
      <form action={save} className={`${card} mt-8 grid max-w-xl gap-6`}>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-mist">
            Открываемся
            <input name="open" type="time" required defaultValue={s.open} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-mist">
            Закрываемся
            <input name="close" type="time" required defaultValue={s.close} className={input} />
          </label>
        </div>

        <label className="flex items-center gap-3">
          <input type="checkbox" name="deliveryEnabled" defaultChecked={s.deliveryEnabled} className="accent-brick" />
          Доставка включена
        </label>

        <label className="flex flex-col gap-1 text-sm text-mist">
          Стоимость доставки, ₽
          <input name="fee" inputMode="decimal" defaultValue={s.deliveryFeeKopecks / 100} className={input} />
        </label>

        <button className={`${btn} justify-self-start`}>Сохранить</button>
      </form>

      <p className="mt-6 max-w-xl text-sm text-mist">
        Бронь и заказы принимаются только в часы работы. Если закрытие позже полуночи, например 02:00,
        бар работает до этого времени следующего дня.
      </p>
    </>
  );
}
