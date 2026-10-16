import Image from "next/image";
import Link from "next/link";
import { Ornament, TapList, Vinyl, type TapItem } from "@/components/SoulUi";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/Reveal";
import { Carousel } from "@/components/Carousel";
import { getMenu } from "@/lib/menu";
import { rub } from "@/lib/money";

export const dynamic = "force-dynamic";

// Первая категория меню (в заглушках это «Пиво»). Если база недоступна, блок скрывается.
async function getTaps(): Promise<TapItem[]> {
  try {
    const [first] = await getMenu();
    return (first?.items ?? []).slice(0, 6).map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: rub(i.priceKopecks),
      available: i.available,
    }));
  } catch (e) {
    console.error("Не удалось загрузить меню для главной", e);
    return [];
  }
}

// Отзывы из Яндекс Карт дословно, без имён авторов. Перед публикацией получить согласие авторов.
const REVIEWS = [
  "Хорошее пиво. Много хорошего пива. Новое место. Хороший ремонт. Уютно.",
  "Комфортное место для посиделок с друзьями. Бармены очень приветливые. Есть возможность договориться отметить день рождения.",
  "Приятная атмосфера, вежливый персонал, вкусное пиво.",
];

const FEATURES = [
  { title: "Бронь стола", text: "Выберите дату, время и число гостей. Подтвердим SMS-сообщением.", href: "/booking" },
  { title: "Меню", text: "Пиво на кране, закуски и напитки. Цены и наличие актуальны.", href: "/menu" },
  { title: "Заказ к столу", text: "Предзаказ по номеру брони или самовывоз к нужному времени.", href: "/order" },
];

const BUBBLES = [
  { left: "8%", size: 14, dur: "11s", delay: "0s" },
  { left: "22%", size: 8, dur: "8s", delay: "2s" },
  { left: "40%", size: 18, dur: "13s", delay: "1s" },
  { left: "63%", size: 10, dur: "9s", delay: "4s" },
  { left: "78%", size: 16, dur: "12s", delay: "3s" },
  { left: "91%", size: 7, dur: "7s", delay: "5s" },
];

export default async function Home() {
  const taps = await getTaps();

  return (
    <main className="min-h-screen bg-ink text-cream">
      <SiteHeader />

      {/* Первый экран: фото зала, пузырьки и слоган */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/img/hall.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-40 md:opacity-60"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-hero-fade" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-full overflow-hidden">
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="bubble"
              style={{ left: b.left, width: b.size, height: b.size, ["--dur" as string]: b.dur, ["--delay" as string]: b.delay }}
            />
          ))}
        </div>

        <div className="mx-auto grid min-h-[85vh] max-w-6xl items-center gap-16 px-6 py-28 md:grid-cols-[1.2fr_1fr] md:gap-12">

          <div className="fade-up">
            <p className="eyebrow">Beer &amp; Music</p>
            <h1 className="mt-4 font-display text-display-xl uppercase">
              Soul <span className="text-brick">Beer</span> Bar
            </h1>
            <p className="mt-8 max-w-md font-display text-3xl text-mist">Stories over a pint</p>
            <p className="mt-3 max-w-md text-lg text-cream-2">Истории за кружкой.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/booking" className="btn-primary">Забронировать стол</Link>
              <Link href="/menu" className="btn-ghost">Смотреть меню</Link>
            </div>
          </div>
          <div className="fade-up [animation-delay:150ms]">
            <Vinyl className="mx-auto max-w-md lamp" />
          </div>
        </div>
      </section>

      {/* На кране: только если в базе есть позиции */}
      {taps.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <Ornament>На кране</Ornament>
          </Reveal>
          <div className="mt-10 grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
            <Reveal>
              <h2 className="font-display text-display-l uppercase">
                Пиво, <span className="text-honey">которое</span> льётся
              </h2>
              <Link href="/menu" className="btn-ghost mt-8">Всё меню</Link>
            </Reveal>
            <Reveal delay={150}>
              <TapList items={taps} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Галерея: только собственные фото бара, листается сама */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <Ornament>Атмосфера</Ornament>
          <h2 className="mt-8 font-display text-display-l uppercase">Зал, вывеска, интерьер</h2>
        </Reveal>
        <Reveal className="mt-10">
          <Carousel
            slides={[
              { src: "/img/hall.jpg", alt: "Зал с красными абажурами" },
              { src: "/img/sign.png", alt: "Вывеска Soul Beer Bar" },
              { src: "/img/interior.png", alt: "Барная стойка и столы" },
            ]}
          />
        </Reveal>
      </section>

      {/* Отзывы */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <Ornament>Гости говорят</Ornament>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <Reveal key={i} delay={i * 120}>
              <blockquote className="h-full border border-cream/15 bg-ink-2 p-6">
                <p className="font-display text-5xl leading-none text-brick">&ldquo;</p>
                <p className="mt-3 text-lg text-cream-2">{r}</p>
                <footer className="mt-4 text-sm text-mist">Отзыв из Яндекс Карт</footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Сценарии: бронь, меню, заказ */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal>
          <div className="sign-frame grid gap-px bg-cream/10 p-0 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group bg-ink p-8 transition duration-300 ease-out-soft hover:bg-ink-2"
              >
                <h3 className="font-display text-2xl uppercase group-hover:text-honey">{f.title}</h3>
                <p className="mt-3 text-cream-2">{f.text}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Призыв к броне */}
      <section className="border-y border-cream/10 bg-ink-2">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center">
          <p className="font-display text-display-l uppercase">Столик на вечер?</p>
          <p className="max-w-xl text-cream-2">Выберите дату и время, гостей и пиво для компании. Подтвердим SMS-сообщением.</p>
          <Link href="/booking" className="btn-primary">Забронировать стол</Link>
        </Reveal>
      </section>

      {/* Контакты */}
      <footer className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm text-mist md:grid-cols-2">
        <div>
          <p className="font-display text-xl uppercase text-cream">Soul Beer Bar</p>
          <p className="mt-3">Москва, Кастанаевская ул., 16Б. Вход слева через ворота.</p>
          <p className="mt-2">Телефон для брони: +7 (977) 894-04-71</p>
        </div>
        <div className="md:text-right">
          <p>Информация об алкогольной продукции предназначена для лиц старше 18 лет.</p>
          <Link href="/menu" className="mt-3 inline-block underline hover:text-honey">Меню</Link>
        </div>
      </footer>
    </main>
  );
}
