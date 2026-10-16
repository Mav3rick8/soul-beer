import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelByToken } from "@/lib/bookings";
import { toResponse } from "@/lib/errors";

const Body = z.object({ token: z.string().min(10).max(100) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    await cancelByToken(parsed.data.token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
