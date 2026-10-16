import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmCode, requestCode } from "@/lib/phone";
import { toResponse } from "@/lib/errors";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), phone: z.string().max(20) }),
  z.object({
    action: z.literal("confirm"),
    phone: z.string().max(20),
    code: z.string().regex(/^\d{6}$/),
  }),
]);

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const data = parsed.data;
    if (data.action === "request") await requestCode(data.phone);
    else await confirmCode(data.phone, data.code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return toResponse(e);
  }
}
