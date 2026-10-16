import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament } from "@/components/SoulUi";

// Каркас внутренних публичных страниц: шапка, орнамент и заголовок в стиле вывески.
export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Ornament>Soul Beer</Ornament>
        <h1 className="mt-6 font-display text-5xl uppercase leading-tight">{title}</h1>
        {children}
      </div>
    </main>
  );
}
