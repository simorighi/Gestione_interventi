// npm run db:locale — PostgreSQL locale per sviluppare SENZA Supabase e senza Docker.
// Avvia un Postgres 17 (pacchetto embedded-postgres) con i dati in web/.db-locale/
// (ignorata da Git), crea le tabelle dallo schema Prisma e il trigger dell'audit
// al primo avvio, poi resta in esecuzione finché non si preme Ctrl+C.
//
// Poi, in un altro terminale:
//   DATABASE_URL=postgresql://dev:dev@127.0.0.1:54320/nordfacility npm run db:seed
//   (e la stessa DATABASE_URL in web/.env per npm run dev)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const RADICE = path.resolve(__dirname, "..");
const DATI = path.join(RADICE, ".db-locale");
const PORTA = Number(process.env.DB_LOCALE_PORT ?? 54320);
const URL = `postgresql://dev:dev@127.0.0.1:${PORTA}/nordfacility`;

async function main() {
  const nuovo = !existsSync(DATI);
  const pg = new EmbeddedPostgres({ databaseDir: DATI, port: PORTA, user: "dev", password: "dev", persistent: true, onLog: () => {} });

  if (nuovo) await pg.initialise();
  await pg.start();

  if (nuovo) {
    await pg.createDatabase("nordfacility");
    const sql = execFileSync(
      "npx",
      ["prisma", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
      { cwd: RADICE, encoding: "utf8" },
    );
    const client = pg.getPgClient("nordfacility", "127.0.0.1");
    await client.connect();
    await client.query(sql);
    await client.query(readFileSync(path.join(RADICE, "prisma/sql/01-audit-immutabile.sql"), "utf8"));
    await client.end();
    console.log("Database creato. Ora: DATABASE_URL=%s npm run db:seed", URL);
  }

  console.log("PostgreSQL locale in ascolto. DATABASE_URL=%s  (Ctrl+C per fermarlo)", URL);
  const ferma = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", ferma);
  process.on("SIGTERM", ferma);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
