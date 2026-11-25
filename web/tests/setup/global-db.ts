// Avviato UNA volta prima dei test di integrazione (vedi vitest.config.ts).
// Accende un PostgreSQL 17 locale e temporaneo (pacchetto embedded-postgres),
// crea le tabelle dallo schema Prisma e inserisce i dati di riferimento.
// Non usa mai il database Supabase del team.
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { PrismaPg } from "@prisma/adapter-pg";
import type { TestProject } from "vitest/node";
import { PrismaClient } from "../../src/generated/prisma/client";
import { inserisciRiferimento } from "../../prisma/riferimento";

const PORTA = 54329;

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const dir = mkdtempSync(path.join(tmpdir(), "nordfacility-pg-"));
  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    port: PORTA,
    user: "test",
    password: "test",
    persistent: false,
    onLog: () => {},
  });
  await pg.initialise();
  await pg.start();

  try {
    project.provide("databaseUrl", await preparaDatabase(pg));
  } catch (err) {
    // Se la preparazione fallisce, il server non deve restare acceso sulla porta.
    await pg.stop();
    throw err;
  }

  // persistent: false → stop() rimuove anche la cartella temporanea dei dati.
  return async () => {
    await pg.stop();
  };
}

async function preparaDatabase(pg: EmbeddedPostgres): Promise<string> {
  await pg.createDatabase("nordfacility_test");
  const url = `postgresql://test:test@127.0.0.1:${PORTA}/nordfacility_test`;
  // Lo SQL delle tabelle è generato dallo schema Prisma (database vuoto → schema),
  // senza comandi distruttivi: il database è appena stato creato.
  const sql = execFileSync(
    "npx",
    ["prisma", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
    { cwd: path.resolve(__dirname, "../.."), encoding: "utf8" },
  );

  const client = pg.getPgClient("nordfacility_test", "127.0.0.1");
  await client.connect();
  await client.query(sql);
  await client.end();

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  await inserisciRiferimento(db);
  await db.$disconnect();
  return url;
}
