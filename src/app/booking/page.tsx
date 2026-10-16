"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { PageShell as Shell } from "@/components/PageShell";

// Часовой пояс бара. При смене пояса поменять здесь и BAR_TZ на сервере.
const OFFSET = "+03:00";

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Проверьте заполнение формы",
  INVALID_PHONE: "Проверьте номер телефона",
  PAST_TIME: "Выберите время в будущем",
  TOO_MANY_CODES: "Слишком много кодов. Попробуйте через час",
  WRONG_CODE: "Неверный код",
  CODE_EXPIRED_OR_LOCKED: "Код истёк или введён неверно несколько раз. Запросите новый",
  INTERNAL: "Что-то пошло не так. Попробуйте позже",
};

type Fields = { date: string; time: string; guests: string; name: string; phone: string; comment: string };

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: { code?: string; error?: string } = await res.json().catch(() => ({}));
  return { ok: res.ok, ...data };
}

export default function BookingPage() {
  const [fields, setFields] = useState<Fields>({
    date: "", time: "", guests: "2", name: "", phone: "", comment: "",
  });
  const [step, setStep] = useState<"form" | "code" | "done">("form");
  const [code, setCode] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onChange =
    (key: keyof Fields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));

  const fail = (err?: string) => setError(ERRORS[err ?? ""] ?? ERRORS.INTERNAL);

  async function sendCode() {
    const r = await post("/api/phone", { action: "request", phone: fields.phone });
    if (r.ok) setStep("code");
    else fail(r.error);
  }

  // Сначала пробуем отправить заявку: если телефон уже подтверждён за последние 30 дней, SMS не нужна.
  async function book() {
    if (!fields.date || !fields.time) return setError("Выберите дату и время");
    setBusy(true);
    setError("");
    const r = await post("/api/bookings", {
      startsAt: new Date(`${fields.date}T${fields.time}:00${OFFSET}`).toISOString(),
      guests: Number(fields.guests),
      name: fields.name,
      phone: fields.phone,
      comment: fields.comment || undefined,
    });
    setBusy(false);
    if (r.ok && r.code) {
      setBookingCode(r.code);
      setStep("done");
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
    const r = await post("/api/phone", { action: "confirm", phone: fields.phone, code });
    setBusy(false);
    if (r.ok) await book();
    else fail(r.error);
  }

  if (step === "done") {
    return (
      <Shell title="Заявка принята">
        <p className="mt-8 text-lg">
          Номер заявки: <span className="font-display text-3xl text-honey">{bookingCode}</span>
        </p>
        <p className="mt-4 text-mist">Подтвердим её SMS-сообщением на номер {fields.phone}.</p>
      </Shell>
    );
  }

  if (step === "code") {
    return (
      <Shell title="Подтвердите номер">
        <p className="mt-6 text-mist">Код отправлен на {fields.phone}.</p>
        <form onSubmit={confirm} className="mt-8 grid max-w-xs gap-6">
          <Field label="Код из SMS">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={input}
            />
          </Field>
          {error && <p role="alert" className="text-brick-light">{error}</p>}
          <button disabled={busy} className={button}>Подтвердить</button>
          <button type="button" onClick={sendCode} disabled={busy} className="justify-self-start text-sm text-mist underline">
            Отправить код ещё раз
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Shell title="Бронь стола">
      <form onSubmit={(e) => { e.preventDefault(); book(); }} className="mt-10 grid gap-6 sm:grid-cols-2">
        <Field label="Дата">
          <input type="date" required value={fields.date} onChange={onChange("date")} className={input} />
        </Field>
        <Field label="Время">
          <input type="time" step={1800} required value={fields.time} onChange={onChange("time")} className={input} />
        </Field>
        <Field label="Гостей">
          <input type="number" min={1} max={20} required value={fields.guests} onChange={onChange("guests")} className={input} />
        </Field>
        <Field label="Имя">
          <input required minLength={2} maxLength={60} value={fields.name} onChange={onChange("name")} className={input} />
        </Field>
        <Field label="Телефон">
          <input type="tel" required value={fields.phone} onChange={onChange("phone")} placeholder="+7 900 000-00-00" className={input} />
        </Field>
        <Field label="Комментарий" wide>
          <textarea rows={3} maxLength={500} value={fields.comment} onChange={onChange("comment")} className={input} />
        </Field>
        <label className="flex gap-3 text-sm text-cream/80 sm:col-span-2">
          <input type="checkbox" required className="mt-1 accent-brick" />
          Согласен на обработку персональных данных
        </label>
        {error && <p role="alert" className="text-brick-light sm:col-span-2">{error}</p>}
        <button disabled={busy} className={`${button} sm:col-span-2 sm:justify-self-start`}>
          {busy ? "Отправляем..." : "Отправить заявку"}
        </button>
      </form>
    </Shell>
  );
}

const input =
  "w-full border-b border-cream/30 bg-transparent py-2 text-base text-cream outline-none focus:border-honey";
// Фокус для кнопок задан глобально в globals.css.
const button = "btn-primary";

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-cream/80 ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}
