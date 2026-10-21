import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// La CLI (migrate, studio) usa la connessione diretta: le migrazioni non
// funzionano attraverso il pooler in transaction mode di Supabase.
// L'app a runtime usa invece DATABASE_URL (vedi src/server/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
