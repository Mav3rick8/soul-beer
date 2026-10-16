"use client";

import { useState } from "react";

type State = "idle" | "busy" | "done" | "error";

export function CancelForm({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");

  async function cancel() {
    setState("busy");
    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") return <p className="mt-8 text-lg">Бронь отменена.</p>;

  return (
    <div className="mt-8 grid gap-6">
      {state === "error" && (
        <p role="alert" className="text-brick-light">
          Бронь не найдена или уже отменена.
        </p>
      )}
      {state !== "error" && <p className="text-mist">Отменить бронь? Действие нельзя будет отменить.</p>}
      <button
        onClick={cancel}
        disabled={state === "busy" || state === "error"}
        className="justify-self-start bg-brick px-8 py-3 font-display text-lg text-cream hover:bg-brick/90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-honey"
      >
        {state === "busy" ? "Отменяем..." : "Отменить бронь"}
      </button>
    </div>
  );
}
