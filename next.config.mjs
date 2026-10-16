import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// Dev-сервер пишет в .next-dev, сборка в .next: так npm run dev и npm run build не ломают друг друга.
export default function config(phase) {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
