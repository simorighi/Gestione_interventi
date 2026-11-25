// Strumenti comuni ai test di integrazione.
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { emettiToken } from "@/server/token";

export const PASSWORD_TEST = "password-di-test";

type Opzioni = {
  /** id dell'utente che fa la richiesta (assente = richiesta anonima) */
  utente?: number;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

/** Header che identificano l'utente nella richiesta. Unico punto da cambiare se cambia l'autenticazione. */
export function headerAutenticazione(utenteId: number): Record<string, string> {
  return { authorization: `Bearer ${emettiToken(utenteId, process.env.AUTH_SECRET!, 3600)}` };
}

/** Chiama un route handler come farebbe Next.js e restituisce status e body JSON. */
export async function chiama<Ctx>(
  handler: (request: Request, ctx: Ctx) => Promise<Response>,
  metodo: string, percorso: string, o: Opzioni = {}) {
  const headers: Record<string, string> = { ...o.headers };
  if (o.utente !== undefined) Object.assign(headers, headerAutenticazione(o.utente));
  if (o.body !== undefined) headers["content-type"] = "application/json";

  const request = new Request(`http://localhost${percorso}`, {
    method: metodo,
    headers,
    body: o.body === undefined ? undefined : typeof o.body === "string" ? o.body : JSON.stringify(o.body),
  });
  // Come Next.js: i parametri del percorso arrivano in ctx.params come Promise.
  const response = await handler(request, { params: Promise.resolve(o.params ?? {}) } as Ctx);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
}

/** Svuota i dati di lavoro (non le anagrafiche) e ricrea un set di utenti, luoghi e segnalazioni noto. */
export async function preparaDati() {
  await db.$executeRawUnsafe(`
    TRUNCATE log_audit, storico_stato, nota_tecnica, allegato, intervento, assegnazione,
             suggerimento_ai, segnalazione, luogo, tecnico, utente_ruolo, utente
    RESTART IDENTITY CASCADE`);

  const ruoli = Object.fromEntries((await db.ruolo.findMany()).map((r) => [r.nome, r.id]));
  const stati = Object.fromEntries((await db.stato.findMany()).map((s) => [s.nome, s.id]));
  const categorie = Object.fromEntries((await db.categoria.findMany()).map((c) => [c.nome, c.id]));
  const priorita = Object.fromEntries((await db.priorita.findMany()).map((p) => [p.nome, p.id]));
  const passwordHash = await bcrypt.hash(PASSWORD_TEST, 4);

  async function utente(email: string, ruolo: string, attivo = true) {
    const u = await db.utente.create({
      data: { nome: email.split("@")[0], cognome: "Test", email, passwordHash, attivo, ruoli: { create: { ruoloId: ruoli[ruolo] } } },
    });
    if (ruolo === "Tecnico") await db.tecnico.create({ data: { utenteId: u.id, tipo: "interno" } });
    return u.id;
  }

  const u = {
    segnalatore: await utente("segnalatore@test.it", "Segnalatore"),
    segnalatore2: await utente("segnalatore2@test.it", "Segnalatore"),
    tecnicoA: await utente("tecnico.a@test.it", "Tecnico"),
    tecnicoB: await utente("tecnico.b@test.it", "Tecnico"),
    responsabile: await utente("responsabile@test.it", "Responsabile manutenzione"),
    admin: await utente("admin@test.it", "Amministratore"),
    disattivato: await utente("ex@test.it", "Segnalatore", false),
  };

  const edificio = await db.luogo.create({ data: { nome: "Sede", tipo: "edificio" } });
  const sala = await db.luogo.create({ data: { nome: "Sala A", tipo: "area", padreId: edificio.id } });

  /** Crea direttamente nel DB una segnalazione nello stato indicato, con storico coerente. */
  async function segnalazione(titolo: string, stato = "Segnalato", segnalatoreId = u.segnalatore, data?: Date) {
    return db.segnalazione.create({
      data: {
        titolo,
        descrizione: `Descrizione di prova per ${titolo}`,
        luogoId: sala.id,
        categoriaId: categorie["Elettrico"],
        prioritaPropostaId: priorita["Media"],
        statoId: stati[stato],
        segnalatoreId,
        dataCreazione: data,
        storicoStati: { create: { statoNuovoId: stati[stato], modificatoDaId: segnalatoreId } },
      },
    });
  }

  async function assegna(segnalazioneId: number, tecnicoId: number) {
    return db.assegnazione.create({ data: { segnalazioneId, tecnicoId, responsabileId: u.responsabile } });
  }

  return { u, stati, categorie, priorita, luoghi: { edificio, sala }, segnalazione, assegna };
}
