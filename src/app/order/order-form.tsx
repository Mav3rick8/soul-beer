"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { rub } from "@/lib/money";

// Часовой пояс бара, как на странице брони.
const OFFSET = "+03:00";

export type OrderItemView = { id: string; name: string; price: number; available: boolean; category: string };
type Type = "PICKUP" | "TABLE" | "DELIVERY";

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Проверьте заполнение формы",
  INVALID_PHONE: "Проверьте номер телефона",
  PAST_TIME: "Выберите время в будущем",
  OUTSIDE_HOURS: "В это время бар не работает. Выберите время в часы работы.",
  ADDRESS_REQUIRED: "Укажите адрес доставки",
  DELIVERY_OFF: "Доставка сейчас недоступна",
  ITEM_UNAVAILABLE: "Одна из позиций закончилась. Обновите корзину.",
  BOOKING_NOT_FOUND: "Бронь с таким номером и телефоном не найдена.",
  TOO_MANY_CODES: "Слишком много кодов. Попробуйте через час",
  WRONG_CODE: "Неверный код",
  CODE_EXPIRED_OR_LOCKED: "Код истёк или введён неверно несколько раз. Запросите новый",
  INTERNAL: "Что-то пошло не так. Попробуйте позже",
};

const input = "w-full border-b border-cream/30 bg-transparent py-2 text-base text-cream outline-none focus:border-honey";
const button = "btn-primary";
const step = "h-9 w-9 border border-cream/30 text-lg";
const label = "flex flex-col gap-1 text-sm text-cream/80";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data: { code?: string; error?: string } = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data };
}

export function OrderForm({
  items,
  delivery,
}: {
  items: OrderItemView[];
  delivery: { enabled: boolean; feeKopecks: number };
}) {
  const [type, setType] = useState<Type>("PICKUP");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [f, setF] = useState({ name: "", phone: "", date: "", time: "", bookingCode: "", address: "", comment: "" });
  const [phase, setPhase] = useState<"form" | "code" | "done">("form");
  const [code, setCode] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fee = type === "DELIVERY" ? delivery.feeKopecks : 0;
  const total = items.reduce((s, i) => s + i.price * (qty[i.id] ?? 0), 0) + fee;
  const types: { v: Type; l: string }[] = [
    { v: "PICKUP", l: "Самовывоз" },
    { v: "TABLE", l: "К столу" },
    ...(delivery.enabled ? [{ v: "DELIVERY" as Type, l: "Доставка" }] : []),
  ];

  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + d) }));
  const onText = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const fail = (err?: string) => setError(ERRORS[err ?? ""] ?? ERRORS.INTERNAL);

  async function sendCode() {
    const r = await post("/api/phone", { action: "request", phone: f.phone });
    if (r.ok) setPhase("code");
    else fail(r.error);
  }

  async function send() {
    const chosen = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (chosen.length === 0) return setError("Добавьте хотя бы одну позицию");
    if (type !== "TABLE" && (!f.date || !f.time)) return setError("Выберите дату и время");

    setBusy(true);
    setError("");
    const r = await post("/api/orders", {
      type,
      name: f.name,
      phone: f.phone,
      comment: f.comment || undefined,
      pickupAt: type !== "TABLE" ? new Date(`${f.date}T${f.time}:00${OFFSET}`).toISOString() : undefined,
      bookingCode: type === "TABLE" ? f.bookingCode : undefined,
      address: type === "DELIVERY" ? f.address : undefined,
      items: chosen,
    });
    setBusy(false);
    if (r.ok && r.code) {
      setOrderCode(r.code);
      setPhase("done");
    } else if (r.error === "PHONE_NOT_VERIFIED") {
      await sendCode();
    } else {
      fail(r.error);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await post("/api/phone", { action: "confirm", phone: f.phone, code });
    setBusy(false);
    if (r.ok) await send();
    else fail(r.error);
  }

  if (phase === "done") {
    return (
      <p className="mt-10 text-lg">
        Заказ принят. Номер: <span className="font-display text-3xl text-honey">{orderCode}</span>. Подтвердим SMS-сообщением.
      </p>
    );
  }

  if (phase === "code") {
    return (
      <form onSubmit={confirm} className="mt-10 grid max-w-xs gap-6">
        <label className={label}>
          Код из SMS
          <input inputMode="numeric" maxLength={6} pattern="\d{6}" required value={code} onChange={(e) => setCode(e.target.value)} className={input} />
        </label>
        {error && <p role="alert" className="text-brick-light">{error}</p>}
        <button disabled={busy} className={button}>Подтвердить</button>
      </form>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-10 grid gap-10">
      <section>
        <h2 className="font-display text-2xl">Что заказываем</h2>
        {items.length === 0 && <p className="mt-4 text-mist">Меню пока пустое.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-4 border-b border-cream/10 py-3">
            <div>
              <p>{i.name}</p>
              <p className="text-sm text-mist">{i.category} · {rub(i.price)}</p>
            </div>
            {i.available ? (
              <div className="flex items-center gap-3">
                <button type="button" aria-label={`Убрать ${i.name}`} onClick={() => change(i.id, -1)} className={step}>−</button>
                <span className="w-6 text-center">{qty[i.id] ?? 0}</span>
                <button type="button" aria-label={`Добавить ${i.name}`} onClick={() => change(i.id, 1)} className={step}>+</button>
              </div>
            ) : (
              <span className="text-sm text-mist">нет в наличии</span>
            )}
          </div>
        ))}
        {fee > 0 && <p className="mt-4 text-sm text-mist">Доставка: {rub(fee)}</p>}
        <p className="mt-4 text-lg">Итого: {rub(total)}</p>
      </section>

      <section className="grid gap-6">
        <div className="flex flex-wrap gap-3">
          {types.map((t) => (
            <button
              key={t.v}
              type="button"
              aria-pressed={type === t.v}
              onClick={() => setType(t.v)}
              className={`border px-4 py-2 ${type === t.v ? "border-honey bg-honey/20" : "border-cream/30"}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {type === "TABLE" ? (
          <label className={label}>
            Номер брони
            <input value={f.bookingCode} onChange={onText("bookingCode")} placeholder="например, A1B2C3" className={input} />
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <label className={label}>Дата<input type="date" value={f.date} onChange={onText("date")} className={input} /></label>
            <label className={label}>Время<input type="time" step={1800} value={f.time} onChange={onText("time")} className={input} /></label>
          </div>
        )}

        {type === "DELIVERY" && (
          <label className={label}>Адрес доставки<input required value={f.address} onChange={onText("address")} className={input} /></label>
        )}

        <label className={label}>Имя<input required minLength={2} value={f.name} onChange={onText("name")} className={input} /></label>
        <label className={label}>Телефон<input type="tel" required value={f.phone} onChange={onText("phone")} className={input} /></label>
        <label className={label}>Комментарий<textarea rows={2} maxLength={500} value={f.comment} onChange={onText("comment")} className={input} /></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" required className="accent-brick" />Согласен на обработку персональных данных</label>

        {error && <p role="alert" className="text-brick-light">{error}</p>}
        <button disabled={busy} className={`${button} justify-self-start`}>
          {busy ? "Отправляем..." : "Отправить заказ"}
        </button>
      </section>
    </form>
  );
}
