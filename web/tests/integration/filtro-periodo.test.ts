// Regressione: docs/bug-report-43.md — il filtro `al` escludeva il giorno indicato.
import { beforeEach, describe, expect, it } from "vitest";
import { GET as lista } from "@/app/api/segnalazioni/route";
import { chiama, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;

beforeEach(async () => {
  d = await preparaDati();
  await d.segnalazione("Del 30 settembre", "Segnalato", d.u.segnalatore, new Date("2026-09-30T18:00:00Z"));
  await d.segnalazione("Del 1 ottobre pomeriggio", "Segnalato", d.u.segnalatore, new Date("2026-10-01T15:30:00Z"));
  await d.segnalazione("Del 2 ottobre", "Segnalato", d.u.segnalatore, new Date("2026-10-02T08:00:00Z"));
});

async function titoli(query: string) {
  const r = await chiama(lista, "GET", `/api/segnalazioni?${query}`, { utente: d.u.responsabile });
  expect(r.status).toBe(200);
  return r.body.items.map((s: { titolo: string }) => s.titolo).sort();
}

describe("filtro per periodo dal/al", () => {
  it("al=2026-10-01 include le segnalazioni create durante il 1 ottobre", async () => {
    expect(await titoli("al=2026-10-01")).toEqual(["Del 1 ottobre pomeriggio", "Del 30 settembre"]);
  });

  it("dal=2026-10-01&al=2026-10-01 restituisce solo quel giorno", async () => {
    expect(await titoli("dal=2026-10-01&al=2026-10-01")).toEqual(["Del 1 ottobre pomeriggio"]);
  });

  it("con data e ora esplicite il limite resta esatto", async () => {
    expect(await titoli("al=2026-10-01T12:00:00Z")).toEqual(["Del 30 settembre"]);
  });
});
