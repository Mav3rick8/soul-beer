import type { Metadata } from "next";
import { Oswald, PT_Sans } from "next/font/google";
import "./globals.css";

// Bebas Neue не содержит кириллицы, поэтому для заголовков берём Oswald.
const display = Oswald({ subsets: ["cyrillic", "latin"], weight: ["500", "700"], variable: "--font-display" });
const body = PT_Sans({ subsets: ["cyrillic", "latin"], weight: ["400", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Soul Beer Bar",
  description: "Soul Beer на Кастанаевской: пиво и музыка, бронь столов, самовывоз и предзаказ к столу",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Класс js ставится до отрисовки: анимации появления включаются только при работающем JS
    <html lang="ru" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
