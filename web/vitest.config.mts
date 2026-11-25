import path from "node:path";
import { defineConfig } from "vitest/config";

// Due progetti:
//  - unit:        logica pura, nessun database (npm run test:unit)
//  - integration: route handler + service + PostgreSQL vero (embedded, avviato
//                 da tests/setup/global-db.ts; non serve Docker né Supabase)
const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  // "server-only" lancia un errore fuori da Next.js: nei test è un modulo vuoto.
  "server-only": path.resolve(import.meta.dirname, "tests/setup/server-only.ts"),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/setup/global-db.ts"],
          setupFiles: ["tests/setup/integration.ts"],
          // Un solo database condiviso: i file girano uno alla volta.
          fileParallelism: false,
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
