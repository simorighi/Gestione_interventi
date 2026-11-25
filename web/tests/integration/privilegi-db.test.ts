// Checklist sicurezza #7 e criticità C6: l'audit non si può modificare né cancellare,
// e l'utente applicativo ha solo i privilegi necessari.
import { readFileSync } from "node:fs";
import path from "node:path";
import { inject, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { db } from "@/server/db";
import { preparaDati } from "../helpers";

const url = inject("databaseUrl");
let auditId: number;
let app: Client;

beforeAll(async () => {
  const d = await preparaDati();
  const s = await d.segnalazione("Per audit");
  auditId = (
    await db.logAudit.create({
      data: { azione: "TEST", tabellaRiferita: "segnalazione", chiaveRiferita: s.id, utenteId: d.u.admin },
    })
  ).id;

  // Applica lo script dell'utente applicativo e gli dà una password di test.
  await db.$executeRawUnsafe(readFileSync(path.resolve(__dirname, "../../prisma/sql/02-utente-applicativo.sql"), "utf8"));
  await db.$executeRawUnsafe(`ALTER ROLE nordfacility_app PASSWORD 'app-test'`);
  app = new Client({ connectionString: url.replace("test:test@", "nordfacility_app:app-test@") });
  await app.connect();
  return () => app.end();
});

describe("log_audit immutabile (trigger)", () => {
  it("UPDATE rifiutato anche dal proprietario delle tabelle", async () => {
    await expect(db.$executeRawUnsafe(`UPDATE log_audit SET azione = 'X' WHERE id_log = ${auditId}`)).rejects.toThrow(
      /immutabile/,
    );
  });

  it("DELETE rifiutato anche dal proprietario delle tabelle", async () => {
    await expect(db.$executeRawUnsafe(`DELETE FROM log_audit WHERE id_log = ${auditId}`)).rejects.toThrow(/immutabile/);
  });
});

describe("utente applicativo nordfacility_app", () => {
  it("può leggere e scrivere dove serve all'app", async () => {
    await expect(app.query("SELECT count(*) FROM segnalazione")).resolves.toBeDefined();
    await expect(app.query("UPDATE segnalazione SET titolo = titolo")).resolves.toBeDefined();
  });

  it.each([
    ["DELETE dall'audit", "DELETE FROM log_audit"],
    ["TRUNCATE dell'audit", "TRUNCATE log_audit"],
    ["DROP di una tabella", "DROP TABLE segnalazione"],
    ["modifica dei ruoli utente", "INSERT INTO utente_ruolo (fk_utente, fk_ruolo) VALUES (1, 1)"],
    ["DELETE di segnalazioni", "DELETE FROM segnalazione"],
  ])("non può fare: %s", async (_n, sql) => {
    await expect(app.query(sql)).rejects.toThrow(/permission denied|must be owner|immutabile/);
  });
});
