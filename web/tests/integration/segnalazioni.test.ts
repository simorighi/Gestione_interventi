// Test di integrazione: route handler → service → Prisma → PostgreSQL vero.
// I numeri (#n) rimandano alle righe della matrice in docs/test-plan.md.
import { beforeEach, describe, expect, it } from "vitest";
import { GET as lista, POST as crea } from "@/app/api/segnalazioni/route";
import { GET as dettaglio } from "@/app/api/segnalazioni/[id]/route";
import { PATCH as cambiaStato } from "@/app/api/segnalazioni/[id]/stato/route";
import { db } from "@/server/db";
import { chiama, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;

beforeEach(async () => {
  d = await preparaDati();
});

describe("PATCH /api/segnalazioni/:id/stato", () => {
  it("#1 transizione valida: 200, stato salvato, storico e audit scritti", async () => {
    const s = await d.segnalazione("Luce rotta");
    const r = await chiama(cambiaStato, "PATCH", `/api/segnalazioni/${s.id}/stato`, {
      utente: d.u.responsabile,
      params: { id: String(s.id) },
      body: { statoId: d.stati["Preso in carico"], motivo: "presa in carico" },
    });

    expect(r.status).toBe(200);
    expect(r.body.stato.nome).toBe("Preso in carico");
    const storico = await db.storicoStato.findMany({ where: { segnalazioneId: s.id }, orderBy: { id: "asc" } });
    expect(storico.at(-1)).toMatchObject({ statoNuovoId: d.stati["Preso in carico"], modificatoDaId: d.u.responsabile });
    const audit = await db.logAudit.findFirstOrThrow({ where: { chiaveRiferita: s.id, azione: "CAMBIO_STATO" } });
    expect(audit.utenteId).toBe(d.u.responsabile);
  });

  it("#2 salto di stato Segnalato → Risolto: 400 e stato invariato", async () => {
    const s = await d.segnalazione("Luce rotta");
    const r = await chiama(cambiaStato, "PATCH", `/api/segnalazioni/${s.id}/stato`, {
      utente: d.u.responsabile,
      params: { id: String(s.id) },
      body: { statoId: d.stati["Risolto"] },
    });

    expect(r.status).toBe(400);
    expect(r.body.error.details.ammessi).toEqual(["Preso in carico"]);
    expect((await db.segnalazione.findUniqueOrThrow({ where: { id: s.id } })).statoId).toBe(d.stati["Segnalato"]);
  });

  it("#3 tecnico NON assegnato: 404 e stato invariato; tecnico assegnato: 200", async () => {
    const s = await d.segnalazione("Luce rotta");
    await d.assegna(s.id, d.u.tecnicoA);
    const opzioni = { params: { id: String(s.id) }, body: { statoId: d.stati["Preso in carico"] } };

    const altro = await chiama(cambiaStato, "PATCH", "/x", { ...opzioni, utente: d.u.tecnicoB });
    expect(altro.status).toBe(404);
    expect((await db.segnalazione.findUniqueOrThrow({ where: { id: s.id } })).statoId).toBe(d.stati["Segnalato"]);

    const assegnato = await chiama(cambiaStato, "PATCH", "/x", { ...opzioni, utente: d.u.tecnicoA });
    expect(assegnato.status).toBe(200);
  });

  it("#4 id inesistente: 404", async () => {
    const r = await chiama(cambiaStato, "PATCH", "/api/segnalazioni/9999/stato", {
      utente: d.u.responsabile,
      params: { id: "9999" },
      body: { statoId: d.stati["Preso in carico"] },
    });
    expect(r.status).toBe(404);
  });

  it("passando a Risolto imposta la data di chiusura", async () => {
    const s = await d.segnalazione("Luce rotta", "In lavorazione");
    await chiama(cambiaStato, "PATCH", `/api/segnalazioni/${s.id}/stato`, {
      utente: d.u.responsabile,
      params: { id: String(s.id) },
      body: { statoId: d.stati["Risolto"] },
    });
    expect((await db.segnalazione.findUniqueOrThrow({ where: { id: s.id } })).dataChiusura).not.toBeNull();
  });

  it("senza utente: 401; Segnalatore: 403", async () => {
    const s = await d.segnalazione("Luce rotta");
    const opzioni = { params: { id: String(s.id) }, body: { statoId: d.stati["Preso in carico"] } };
    expect((await chiama(cambiaStato, "PATCH", "/x", opzioni)).status).toBe(401);
    expect((await chiama(cambiaStato, "PATCH", "/x", { ...opzioni, utente: d.u.segnalatore })).status).toBe(403);
  });
});

describe("POST /api/segnalazioni", () => {
  const body = () => ({
    titolo: "Perdita lavandino",
    descrizione: "Il lavandino del bagno perde acqua dal sifone.",
    luogoId: d.luoghi.sala.id,
    categoriaId: d.categorie["Idraulico"],
    prioritaPropostaId: d.priorita["Alta"],
  });

  it("crea in stato Segnalato con il segnalatore = utente della richiesta", async () => {
    const r = await chiama(crea, "POST", "/api/segnalazioni", { utente: d.u.segnalatore, body: body() });
    expect(r.status).toBe(201);
    expect(r.body.stato.nome).toBe("Segnalato");
    expect(r.body.segnalatore.id).toBe(d.u.segnalatore);
    expect(r.body.segnalatore).not.toHaveProperty("passwordHash");
  });

  it("#5 campo obbligatorio assente: 400 VALIDATION_ERROR, niente scritto nel DB", async () => {
    const senzaTitolo: Partial<ReturnType<typeof body>> = body();
    delete senzaTitolo.titolo;
    const r = await chiama(crea, "POST", "/api/segnalazioni", { utente: d.u.segnalatore, body: senzaTitolo });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
    expect(await db.segnalazione.count()).toBe(0);
  });

  it("body non JSON: 400", async () => {
    const r = await chiama(crea, "POST", "/api/segnalazioni", { utente: d.u.segnalatore, body: "{non json" });
    expect(r.status).toBe(400);
  });

  it("luogo inesistente: 400 INVALID_REFERENCE", async () => {
    const r = await chiama(crea, "POST", "/api/segnalazioni", {
      utente: d.u.segnalatore,
      body: { ...body(), luogoId: 9999 },
    });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("INVALID_REFERENCE");
  });

  it("utente disattivato: 401", async () => {
    const r = await chiama(crea, "POST", "/api/segnalazioni", { utente: d.u.disattivato, body: body() });
    expect(r.status).toBe(401);
  });
});

describe("GET /api/segnalazioni e /:id", () => {
  it("dettaglio: transizioni ammesse calcolate dallo stato attuale", async () => {
    const s = await d.segnalazione("Luce rotta", "In lavorazione");
    const r = await chiama(dettaglio, "GET", `/api/segnalazioni/${s.id}`, {
      utente: d.u.responsabile,
      params: { id: String(s.id) },
    });
    expect(r.status).toBe(200);
    expect(r.body.transizioniAmmesse).toEqual(["Sospeso", "Risolto"]);
  });

  it("lista: filtro testo libero e paginazione", async () => {
    await d.segnalazione("Luce rotta");
    await d.segnalazione("Perdita acqua");
    const r = await chiama(lista, "GET", "/api/segnalazioni?q=LUCE&pageSize=1", { utente: d.u.responsabile });
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(1);
    expect(r.body.items[0].titolo).toBe("Luce rotta");
  });
});
