import "dotenv/config";
import { defineConfig } from "prisma/config";

// La CLI (migrate, studio, seed) usa DATABASE_URL; l'app a runtime la legge in
// src/server/db.ts. Per `prisma generate` (lanciato anche da `npm install`)
// la connessione non serve: se DATABASE_URL manca il client si genera lo stesso,
// e sono i comandi che parlano davvero col DB a fallire con un errore chiaro.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
