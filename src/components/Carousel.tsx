"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Slide = { src: string; alt: string };

const STEP_MS = 700; // длительность сдвига на один кадр

// Бесконечная карусель: три фото в ряд, сдвиг на одно фото. Список повторён дважды,
// чтобы переход от последнего фото к первому был незаметен: в конце сдвиг сбрасывается без анимации.
// Пауза при наведении и фокусе. При prefers-reduced-motion автоплей выключен.
export function Carousel({ slides, interval = 4000 }: { slides: Slide[]; interval?: number }) {
  const n = slides.length;
  const loop = [...slides, ...slides];
  const slideW = 100 / (2 * n); // ширина одного кадра в % от дорожки (дорожка = 200% контейнера)

  const [pos, setPos] = useState(0); // 0..n, позиция первого видимого кадра
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Переход без анимации, затем снова включаем анимацию на следующих кадрах
  const jump = (to: number) => {
    setInstant(true);
    setPos(to);
    requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
  };

  // Дошли до копии первого набора: незаметно возвращаемся к началу
  useEffect(() => {
    if (pos !== n) return;
    timer.current = setTimeout(() => jump(0), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [pos, n]);

  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setPos((p) => (p < n ? p + 1 : p)), interval);
    return () => clearInterval(t);
  }, [paused, n, interval]);

  const next = () => setPos((p) => (p < n ? p + 1 : p));
  const prev = () => {
    if (pos === 0) {
      jump(n);
      setTimeout(() => setPos(n - 1), 60);
    } else {
      setPos((p) => p - 1);
    }
  };

  const active = pos % n;

  return (
    <div
      role="region"
      aria-roledescription="карусель"
      aria-label="Фото бара"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            width: "200%",
            transform: `translateX(-${pos * slideW}%)`,
            transition: instant ? "none" : `transform ${STEP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {loop.map((s, i) => (
            <div key={i} style={{ width: `${slideW}%` }} className="shrink-0 p-1.5" aria-hidden={i < pos || i >= pos + n}>
              <div className="relative aspect-[3/4] overflow-hidden bg-ink-2 md:aspect-[4/3]">
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 33vw"
                  className="object-cover"
                  priority={i < n}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={prev}
        aria-label="Предыдущие фото"
        className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-cream/40 bg-ink/80 text-xl text-cream transition hover:border-honey hover:text-honey md:left-3"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Следующие фото"
        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-cream/40 bg-ink/80 text-xl text-cream transition hover:border-honey hover:text-honey md:right-3"
      >
        ›
      </button>

      <div className="mt-4 flex justify-center gap-3" role="group" aria-label="Выбор фото">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => jump(i)}
            aria-label={`Фото ${i + 1}: ${s.alt}`}
            aria-current={i === active}
            className={`h-2.5 w-2.5 rounded-full transition ${i === active ? "bg-honey" : "bg-cream/30 hover:bg-cream/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
