import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

const Body = z.object({
  phone: z.string().max(20),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  const staff = phone ? await prisma.staff.findUnique({ where: { phone } }) : null;
  if (!staff || !staff.active || !staff.passwordHash) {
    return NextResponse.json({ error: "BAD_CREDENTIALS" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, staff.passwordHash);
  if (!ok) return NextResponse.json({ error: "BAD_CREDENTIALS" }, { status: 401 });

  setSessionCookie(staff.id);
  return NextResponse.json({ ok: true });
}
