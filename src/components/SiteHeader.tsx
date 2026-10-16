import Link from "next/link";

// Общая шапка публичных страниц. Админка использует свою шапку в admin/layout.tsx.
export function SiteHeader() {
  return (
    <header className="border-b border-cream/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl uppercase tracking-wide">
          Soul <span className="text-brick">Beer</span>
        </Link>
        <nav className="flex gap-6 text-sm uppercase tracking-widest text-cream-2 md:gap-8">
          <Link href="/menu" className="hover:text-honey">Меню</Link>
          <Link href="/order" className="hover:text-honey">Заказ</Link>
          <Link href="/booking" className="hover:text-honey">Бронь</Link>
        </nav>
      </div>
    </header>
  );
}
