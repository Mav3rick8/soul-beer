import type { ReactNode } from "react";

// Пластинка из логотипа. Вращается медленно; при prefers-reduced-motion останавливается.
// Декоративная, поэтому скрыта от скринридеров.
export function Vinyl({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative aspect-square w-full ${className}`}>
      <div className="absolute inset-0 animate-spin-slow rounded-full bg-[repeating-radial-gradient(circle,#2b221e_0_2px,#1E1714_2px_5px)] shadow-sign ring-1 ring-cream/10 motion-reduce:animate-none">
        <div className="absolute inset-[38%] rounded-full bg-brick" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
      </div>
    </div>
  );
}

export function Ornament({ children }: { children: ReactNode }) {
  return (
    <div className="ornament">
      <span className="font-body text-xs uppercase tracking-[0.3em]">{children}</span>
    </div>
  );
}

export type TapItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
};

// «На кране»: таблица в духе Mother Earth, но в палитре бара.
export function TapList({ items }: { items: TapItem[] }) {
  return (
    <ul className="divide-y divide-cream/10 border border-cream/15 bg-ink-2">
      {items.map((b) => (
        <li
          key={b.id}
          className={`grid grid-cols-[1fr_auto] items-baseline gap-6 px-5 py-4 ${b.available ? "" : "opacity-40"}`}
        >
          <div>
            <p className="font-display text-xl uppercase tracking-wide text-honey-light">{b.name}</p>
            {b.description && <p className="text-sm text-mist">{b.description}</p>}
          </div>
          <p className="text-right font-display text-xl">{b.available ? b.price : "нет"}</p>
        </li>
      ))}
    </ul>
  );
}
