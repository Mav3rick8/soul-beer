import Link from "next/link";
import { redirect } from "next/navigation";
import { clearSessionCookie, getCurrentStaff } from "@/lib/auth/session";

async function logout() {
  "use server";
  clearSessionCookie();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  return (
    <div className="min-h-screen bg-ink text-cream">
      {staff && (
        <header className="flex items-center justify-between border-b border-cream/10 px-6 py-4">
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/admin/bookings" className="font-display text-xl">Soul Beer · админка</Link>
            <Link href="/admin/orders" className="text-mist">Заказы</Link>
            <Link href="/admin/menu" className="text-mist">Меню</Link>
            <Link href="/admin/tables" className="text-mist">Столы</Link>
            <Link href="/admin/events" className="text-mist">Афиша</Link>
            <Link href="/admin/settings" className="text-mist">Настройки</Link>
          </nav>
          <form action={logout}>
            <button className="text-sm text-mist underline">Выйти</button>
          </form>
        </header>
      )}
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
