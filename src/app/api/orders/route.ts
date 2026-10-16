import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders";
import { toResponse } from "@/lib/errors";

const Body = z.object({
  type: z.enum(["PICKUP", "TABLE", "DELIVERY"]),
  address: z.string().trim().max(200).optional(),
  name: z.string().trim().min(2).max(60),
  phone: z.string().max(20),
  comment: z.string().trim().max(500).optional(),
  pickupAt: z.string().datetime({ offset: true }).optional(),
  bookingCode: z.string().trim().max(10).optional(),
  items: z
    .array(z.object({ menuItemId: z.string().max(40), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const { pickupAt, ...rest } = parsed.data;
    const result = await createOrder({ ...rest, pickupAt: pickupAt ? new Date(pickupAt) : undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return toResponse(e);
  }
}
