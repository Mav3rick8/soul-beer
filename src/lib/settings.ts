import { prisma } from "@/lib/prisma";

export type Settings = { open: string; close: string; deliveryEnabled: boolean; deliveryFeeKopecks: number };

const DEFAULTS: Settings = { open: "14:00", close: "02:00", deliveryEnabled: false, deliveryFeeKopecks: 0 };
const TZ = process.env.BAR_TZ ?? "Europe/Moscow";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as unknown as Partial<Settings>;
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(s: Settings) {
  for (const [key, value] of Object.entries(s)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
}

/** Часы могут переходить через полночь: например, 14:00–02:00. */
export function isWithinHours(at: Date, s: Settings): boolean {
  const [h, m] = at
    .toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .split(":")
    .map(Number);
  const now = h * 60 + m;
  const open = toMin(s.open);
  const close = toMin(s.close);
  return open <= close ? now >= open && now < close : now >= open || now < close;
}
