// Backlog voce 4: il Responsabile assegna una segnalazione a uno o più tecnici.
import { beforeEach, describe, expect, it } from "vitest";
import { POST as assegna } from "@/app/api/segnalazioni/[id]/assegnazioni/route";
import { GET as tecnici } from "@/app/api/tecnici/route";
import { db } from "@/server/db";
import { chiama, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;
let s: { id: number };

beforeEach(async () => {
  d = await preparaDati();
  s = await d.segnalazione("Da assegnare");
});

const richiesta = (utente: number, tecnicoIds: unknown, id = s.id) =>
  chiama(assegna, "POST", `/api/segnalazioni/${id}/assegnazioni`, {
    utente,
    params: { id: String(id) },
    body: { tecnicoIds },
  });

describe("POST /api/segnalazioni/:id/assegnazioni", () => {
  it("il Responsabile assegna due tecnici: 201, righe salvate, audit per ciascuno", async () => {
    const r = await richiesta(d.u.responsabile, [d.u.tecnicoA, d.u.tecnicoB]);
    expect(r.status).toBe(201);
    expect(r.body.assegnazioni.map((a: { tecnicoId: number }) => a.tecnicoId).sort()).toEqual(
      [d.u.tecnicoA, d.u.tecnicoB].sort(),
    );
    const audit = await db.logAudit.findMany({ where: { chiaveRiferita: s.id, azione: "ASSEGNAZIONE" } });
    expect(audit).toHaveLength(2);
    expect(audit.every((a) => a.utenteId === d.u.responsabile)).toBe(true);
  });

  it("Tecnico e Segnalatore non possono assegnare: 403", async () => {
    expect((await richiesta(d.u.tecnicoA, [d.u.tecnicoA])).status).toBe(403);
    expect((await richiesta(d.u.segnalatore, [d.u.tecnicoA])).status).toBe(403);
    expect(await db.assegnazione.count()).toBe(0);
  });

  it("un utente che non è tecnico: 400 e nessuna assegnazione (transazione annullata)", async () => {
    const r = await richiesta(d.u.responsabile, [d.u.tecnicoA, d.u.segnalatore]);
    expect(r.status).toBe(400);
    expect(r.body.error.details.tecnicoIds).toEqual([d.u.segnalatore]);
    expect(await db.assegnazione.count()).toBe(0);
  });

  it("tecnico già assegnato: 409", async () => {
    await d.assegna(s.id, d.u.tecnicoA);
    expect((await richiesta(d.u.responsabile, [d.u.tecnicoA])).status).toBe(409);
  });

  it("segnalazione già risolta: 400", async () => {
    const chiusa = await d.segnalazione("Chiusa", "Risolto");
    expect((await richiesta(d.u.responsabile, [d.u.tecnicoA], chiusa.id)).status).toBe(400);
  });

  it.each([[[]], [[1, 1]], ["abc"]])("body non valido %j: 400", async (ids) => {
    expect((await richiesta(d.u.responsabile, ids)).status).toBe(400);
  });

  it("segnalazione inesistente: 404", async () => {
    expect((await richiesta(d.u.responsabile, [d.u.tecnicoA], 9999)).status).toBe(404);
  });
});

describe("GET /api/tecnici", () => {
  it("il Responsabile vede i tecnici attivi, senza email", async () => {
    const r = await chiama(tecnici, "GET", "/api/tecnici", { utente: d.u.responsabile });
    expect(r.status).toBe(200);
    expect(r.body.map((t: { id: number }) => t.id).sort()).toEqual([d.u.tecnicoA, d.u.tecnicoB].sort());
    expect(JSON.stringify(r.body)).not.toMatch(/@/);
  });

  it("il Segnalatore no: 403", async () => {
    expect((await chiama(tecnici, "GET", "/api/tecnici", { utente: d.u.segnalatore })).status).toBe(403);
  });
});
