import type { Config } from "tailwindcss";

// Палитра по вывеске и интерьеру бара.
// Оттенки ink-2, brick-dark, honey-light, cream-2 нужны для поверхностей и состояний.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E1714",
        "ink-2": "#2B221E",      // карточки, поверхности над фоном
        "ink-3": "#3A2D27",      // hover, разделители
        cream: "#F2E8D5",
        "cream-2": "#E6D8BC",    // вторичный текст на светлом
        brick: "#B8262B",        // акцент: CTA, абажуры
        "brick-dark": "#8E1D21", // hover для brick
        "brick-light": "#E5615F", // текст ошибок: brick на ink даёт контраст ниже 3:1
        honey: "#D9962B",        // свет, пиво, фокус
        "honey-light": "#F0BE6A",
        mist: "#7D93A6",         // слоган, подписи
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      fontSize: {
        // Высота строки не меньше 1: диакритика кириллицы (Ё, Й) заходит на строку выше при 0.9–0.95
        "display-xl": ["clamp(3.5rem, 9vw, 7.5rem)", { lineHeight: "1.02" }],
        "display-l": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.1" }],
      },
      animation: {
        "spin-slow": "spin 14s linear infinite",
      },
      boxShadow: {
        lamp: "0 0 80px -12px rgba(217, 150, 43, 0.45)",
        sign: "inset 0 0 0 1px rgba(242, 232, 213, 0.12), 0 20px 60px -20px rgba(0, 0, 0, 0.7)",
      },
      backgroundImage: {
        "hero-fade": "linear-gradient(180deg, rgba(30,23,20,0.25) 0%, rgba(30,23,20,0.85) 75%, #1E1714 100%)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
