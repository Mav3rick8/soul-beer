"use client";

import { useState, type FormEvent } from "react";

const field = "w-full border-b border-cream/30 bg-transparent py-2 text-cream outline-none focus:border-honey";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (res.ok) {
      window.location.href = "/admin/bookings";
      return;
    }
    setError("Неверный телефон или пароль");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-16 grid max-w-sm gap-6">
      <h1 className="font-display text-4xl">Вход для сотрудников</h1>
      <label className="flex flex-col gap-1 text-sm text-cream/70">
        Телефон
        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-cream/70">
        Пароль
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </label>
      {error && <p role="alert" className="text-brick-light">{error}</p>}
      <button disabled={busy} className="bg-brick py-3 font-display text-lg text-cream disabled:opacity-50">
        Войти
      </button>
    </form>
  );
}
