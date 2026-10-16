import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/bookings";
import { toResponse } from "@/lib/errors";

const Body = z.object({
  startsAt: z.string().datetime({ offset: true }),
  guests: z.number().int().min(1).max(20),
  name: z.string().trim().min(2).max(60),
  phone: z.string().max(20),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const { startsAt, ...rest } = parsed.data;
    const result = await createBooking({ ...rest, startsAt: new Date(startsAt) });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return toResponse(e);
  }
}
