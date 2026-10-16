/** Цены хранятся в копейках. Формат для показа: «350 ₽». Без зависимостей от сервера. */
export const rub = (kopecks: number) => `${Math.round(kopecks / 100)} ₽`;

/** «350», «350,50», «350.5» → копейки. Пустой или некорректный ввод → null. */
export function toKopecks(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? Math.round(n * 100) : null;
}
