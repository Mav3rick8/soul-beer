import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "sb_session";
const TTL_MS = 12 * 3600_000;

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET не задан");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function setSessionCookie(staffId: string) {
  const payload = `${staffId}.${Date.now() + TTL_MS}`;
  cookies().set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getCurrentStaff() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  const [staffId, exp, sig] = token.split(".");
  if (!staffId || !exp || !sig || Number(exp) < Date.now()) return null;

  const expected = Buffer.from(sign(`${staffId}.${exp}`));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  return staff?.active ? staff : null;
}

/** Вход для сотрудника. Если передан список ролей, остальных отправляем на брони. */
export async function requireStaff(roles?: ("OWNER" | "ADMIN" | "HOST")[]) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  if (roles && !roles.includes(staff.role)) redirect("/admin/bookings");
  return staff;
}
