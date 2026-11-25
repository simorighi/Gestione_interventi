// Regressione: docs/bug-report-42.md — ogni utente vede solo le segnalazioni che gli competono.
// Checklist sicurezza #1/#2 e criticità C2.
import { beforeEach, describe, expect, it } from "vitest";
import { GET as lista } from "@/app/api/segnalazioni/route";
import { GET as dettaglio } from "@/app/api/segnalazioni/[id]/route";
import { GET as luoghi } from "@/app/api/luoghi/route";
import { GET as stati } from "@/app/api/stati/route";
import { GET as categorie } from "@/app/api/categorie/route";
import { GET as priorita } from "@/app/api/priorita/route";
import { chiama, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;
let s42: { id: number }; // assegnata al tecnico A, segnalata da segnalatore
let altra: { id: number }; // assegnata al tecnico B, segnalata da segnalatore2

beforeEach(async () => {
  d = await preparaDati();
  s42 = await d.segnalazione("Intervento 42", "Preso in carico", d.u.segnalatore);
  altra = await d.segnalazione("Intervento altrui", "Preso in carico", d.u.segnalatore2);
  await d.assegna(s42.id, d.u.tecnicoA);
  await d.assegna(altra.id, d.u.tecnicoB);
});

async function titoliVisti(utente: number) {
  const r = await chiama(lista, "GET", "/api/segnalazioni", { utente });
  expect(r.status).toBe(200);
  return { titoli: r.body.items.map((s: { titolo: string }) => s.titolo).sort(), total: r.body.total };
}

describe("lista segnalazioni filtrata per ruolo", () => {
  it("bug 42: il tecnico B NON vede l'intervento 42 assegnato al tecnico A", async () => {
    expect(await titoliVisti(d.u.tecnicoB)).toEqual({ titoli: ["Intervento altrui"], total: 1 });
  });

  it("il tecnico A vede solo il proprio", async () => {
    expect((await titoliVisti(d.u.tecnicoA)).titoli).toEqual(["Intervento 42"]);
  });

  it("il segnalatore vede solo le segnalazioni che ha creato", async () => {
    expect((await titoliVisti(d.u.segnalatore2)).titoli).toEqual(["Intervento altrui"]);
  });

  it("responsabile e amministratore vedono tutto", async () => {
    expect((await titoliVisti(d.u.responsabile)).total).toBe(2);
    expect((await titoliVisti(d.u.admin)).total).toBe(2);
  });

  it("il filtro tecnicoId non scavalca la visibilità", async () => {
    const r = await chiama(lista, "GET", `/api/segnalazioni?tecnicoId=${d.u.tecnicoA}`, { utente: d.u.tecnicoB });
    expect(r.body.total).toBe(0);
  });
});

describe("dettaglio segnalazione", () => {
  it("una segnalazione non di competenza risponde 404 (non ne rivela l'esistenza)", async () => {
    const r = await chiama(dettaglio, "GET", `/api/segnalazioni/${s42.id}`, {
      utente: d.u.tecnicoB,
      params: { id: String(s42.id) },
    });
    expect(r.status).toBe(404);
  });

  it("le risposte non contengono le email degli altri utenti", async () => {
    const r = await chiama(dettaglio, "GET", `/api/segnalazioni/${s42.id}`, {
      utente: d.u.tecnicoA,
      params: { id: String(s42.id) },
    });
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toMatch(/@test\.it/);
  });
});

describe("letture senza autenticazione", () => {
  it.each([
    ["lista segnalazioni", lista],
    ["luoghi", luoghi],
    ["stati", stati],
    ["categorie", categorie],
    ["priorità", priorita],
  ])("%s senza token: 401", async (_n, handler) => {
    expect((await chiama(handler, "GET", "/api/x")).status).toBe(401);
  });

  it("dettaglio senza token: 401", async () => {
    expect((await chiama(dettaglio, "GET", "/x", { params: { id: String(s42.id) } })).status).toBe(401);
  });
});
