import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { AppError, badRequest, conflict, forbidden, notFound } from "../errors";
import type { CurrentUser, NomeRuolo } from "../auth";
import type {
  assegnazioneInputSchema,
  categoriaInputSchema,
  luogoInputSchema,
  notaInputSchema,
  segnalazioneUpdateSchema,
  statoInputSchema,
  transizioneInputSchema,
  utenteCreateSchema,
  utenteUpdateSchema,
} from "../validation/gestione";
import type { z } from "zod";

type CategoriaInput = z.infer<typeof categoriaInputSchema>;
type LuogoInput = z.infer<typeof luogoInputSchema>;
type UtenteCreateInput = z.infer<typeof utenteCreateSchema>;
type UtenteUpdateInput = z.infer<typeof utenteUpdateSchema>;
type NotaInput = z.infer<typeof notaInputSchema>;
type AssegnazioneInput = z.infer<typeof assegnazioneInputSchema>;
type StatoInput = z.infer<typeof statoInputSchema>;
type TransizioneInput = z.infer<typeof transizioneInputSchema>;
type SegnalazioneUpdateInput = z.infer<typeof segnalazioneUpdateSchema>;

async function audit(
  userId: number,
  action: string,
  table: string,
  id: number,
  before?: unknown,
  after?: unknown,
) {
  await db.logAudit.create({
    data: {
      azione: action,
      tabellaRiferita: table,
      chiaveRiferita: id,
      valorePrima: before === undefined ? null : JSON.stringify(before),
      valoreDopo: after === undefined ? null : JSON.stringify(after),
      utenteId: userId,
    },
  });
}

function normalizeOptional(value: string | null | undefined) {
  return value?.trim() || null;
}

export function listLuoghi(includeArchived = false) {
  return db.luogo.findMany({
    where: includeArchived ? {} : { archivedAt: null },
    include: { padre: { select: { id: true, nome: true } } },
    orderBy: [{ padreId: { sort: "asc", nulls: "first" } }, { nome: "asc" }],
  });
}

export async function createLuogo(input: LuogoInput, user: CurrentUser) {
  const padreId = input.tipo === "edificio" ? null : input.padreId;
  if (input.tipo !== "edificio" && !padreId) throw badRequest("Seleziona il luogo padre");
  if (padreId) {
    const parent = await db.luogo.findFirst({ where: { id: padreId, archivedAt: null } });
    if (!parent) throw badRequest("Luogo padre inesistente o archiviato");
    if (parent.tipo === "impianto") throw badRequest("Un impianto non può contenere altri luoghi");
  }
  const place = await db.luogo.create({
    data: {
      nome: input.nome,
      tipo: input.tipo,
      via: normalizeOptional(input.via),
      citta: normalizeOptional(input.citta),
      cap: normalizeOptional(input.cap),
      padreId,
    },
  });
  await audit(user.id, "CREAZIONE", "luogo", place.id, undefined, place);
  return place;
}

export async function updateLuogo(id: number, input: LuogoInput, user: CurrentUser) {
  const current = await db.luogo.findFirst({ where: { id, archivedAt: null } });
  if (!current) throw notFound("Luogo non trovato");
  const padreId = input.tipo === "edificio" ? null : input.padreId;
  if (input.tipo !== "edificio" && !padreId) throw badRequest("Seleziona il luogo padre");
  if (padreId) {
    if (padreId === id) throw badRequest("Un luogo non può essere padre di sé stesso");
    const parent = await db.luogo.findFirst({ where: { id: padreId, archivedAt: null } });
    if (!parent || parent.tipo === "impianto") throw badRequest("Luogo padre non valido");
    const ancestors = new Set<number>();
    let ancestorId: number | null = parent.id;
    while (ancestorId !== null) {
      if (ancestorId === id || ancestors.has(ancestorId)) {
        throw badRequest("La modifica creerebbe un ciclo nella gerarchia");
      }
      ancestors.add(ancestorId);
      const ancestor: { padreId: number | null } | null = await db.luogo.findUnique({
        where: { id: ancestorId },
        select: { padreId: true },
      });
      ancestorId = ancestor?.padreId ?? null;
    }
  }
  if (input.tipo === "impianto" && current.tipo !== "impianto") {
    const activeChildren = await db.luogo.count({ where: { padreId: id, archivedAt: null } });
    if (activeChildren) throw conflict("Un luogo con figli attivi non può diventare un impianto");
  }
  const updated = await db.luogo.update({
    where: { id },
    data: {
      nome: input.nome,
      tipo: input.tipo,
      via: normalizeOptional(input.via),
      citta: normalizeOptional(input.citta),
      cap: normalizeOptional(input.cap),
      padreId,
    },
  });
  await audit(user.id, "MODIFICA", "luogo", id, current, updated);
  return updated;
}

export async function archiveLuogo(id: number, user: CurrentUser) {
  const current = await db.luogo.findFirst({ where: { id, archivedAt: null } });
  if (!current) throw notFound("Luogo non trovato");
  const [children, openReports] = await Promise.all([
    db.luogo.count({ where: { padreId: id, archivedAt: null } }),
    db.segnalazione.count({ where: { luogoId: id, archivedAt: null } }),
  ]);
  if (children || openReports) {
    throw conflict("Archivia prima i luoghi figli e le segnalazioni associate");
  }
  const archived = await db.luogo.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(user.id, "ARCHIVIAZIONE", "luogo", id, current, archived);
  return archived;
}

export function listCategorie(includeInactive = false) {
  return db.categoria.findMany({
    where: includeInactive ? {} : { attiva: true },
    orderBy: { nome: "asc" },
  });
}

export async function createCategoria(input: CategoriaInput, user: CurrentUser) {
  const category = await db.categoria.create({
    data: {
      nome: input.nome,
      descrizione: normalizeOptional(input.descrizione),
      attiva: input.attiva ?? true,
    },
  });
  await audit(user.id, "CREAZIONE", "categoria", category.id, undefined, category);
  return category;
}

export async function updateCategoria(id: number, input: CategoriaInput, user: CurrentUser) {
  const current = await db.categoria.findUnique({ where: { id } });
  if (!current) throw notFound("Categoria non trovata");
  const updated = await db.categoria.update({
    where: { id },
    data: {
      nome: input.nome,
      descrizione: normalizeOptional(input.descrizione),
      ...(input.attiva === undefined ? {} : { attiva: input.attiva }),
    },
  });
  await audit(user.id, "MODIFICA", "categoria", id, current, updated);
  return updated;
}

export async function archiveCategoria(id: number, user: CurrentUser) {
  const current = await db.categoria.findUnique({ where: { id } });
  if (!current) throw notFound("Categoria non trovata");
  if (!current.attiva) return current;
  const updated = await db.categoria.update({ where: { id }, data: { attiva: false } });
  await audit(user.id, "DISATTIVAZIONE", "categoria", id, current, updated);
  return updated;
}

function supabaseAdminConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new AppError(503, "AUTH_ADMIN_NOT_CONFIGURED", "Provisioning Supabase Auth non configurato lato server");
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function adminAuthRequest(path: string, method: string, body?: unknown) {
  const { url, key } = supabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("[auth-admin] richiesta rifiutata", { path, status: response.status });
    throw new AppError(502, "AUTH_PROVIDER_ERROR", "Supabase Auth non ha completato l'operazione");
  }
  return data;
}

export function listUtenti() {
  return db.utente.findMany({
    select: {
      id: true,
      nome: true,
      cognome: true,
      email: true,
      attivo: true,
      dataCreazione: true,
      ruoli: { select: { ruolo: { select: { nome: true } } } },
      tecnico: { select: { tipo: true, azienda: true, specializzazione: true } },
    },
    orderBy: [{ cognome: "asc" }, { nome: "asc" }],
  });
}

export async function createUtente(input: UtenteCreateInput, actor: CurrentUser) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.utente.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw conflict("Esiste già un utente con questa email");
  if (input.ruolo === "Tecnico" && !input.specializzazione) {
    throw badRequest("La specializzazione è obbligatoria per un tecnico");
  }
  const role = await db.ruolo.findUnique({ where: { nome: input.ruolo } });
  if (!role) throw badRequest("Ruolo non presente nel database");

  const authData = await adminAuthRequest("users", "POST", {
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { nome: input.nome, cognome: input.cognome },
  });
  if (typeof authData !== "object" || authData === null || !("id" in authData) || typeof authData.id !== "string") {
    throw new AppError(502, "AUTH_PROVIDER_ERROR", "Supabase Auth ha restituito una risposta non valida");
  }

  try {
    const passwordHash = await bcrypt.hash(randomBytes(48).toString("hex"), 10);
    const user = await db.$transaction(async (tx) => {
      const created = await tx.utente.create({
        data: {
          nome: input.nome,
          cognome: input.cognome,
          email,
          passwordHash,
          ruoli: { create: { ruoloId: role.id } },
          ...(input.ruolo === "Tecnico"
            ? {
                tecnico: {
                  create: {
                    tipo: input.tipoTecnico ?? "interno",
                    specializzazione: input.specializzazione!,
                    azienda: input.azienda || null,
                  },
                },
              }
            : {}),
        },
        select: { id: true, nome: true, cognome: true, email: true, attivo: true },
      });
      await tx.logAudit.create({
        data: {
          azione: "CREAZIONE",
          tabellaRiferita: "utente",
          chiaveRiferita: created.id,
          valoreDopo: JSON.stringify({ email, ruolo: input.ruolo }),
          utenteId: actor.id,
        },
      });
      return created;
    });
    return user;
  } catch (error) {
    try {
      await adminAuthRequest(`users/${encodeURIComponent(authData.id)}`, "DELETE");
    } catch (rollbackError) {
      console.error("[auth-admin] rollback utente non riuscito", {
        authUserId: authData.id,
        errorName: rollbackError instanceof Error ? rollbackError.name : "UnknownError",
      });
    }
    throw error;
  }
}

export async function updateUtente(id: number, input: UtenteUpdateInput, actor: CurrentUser) {
  const current = await db.utente.findUnique({
    where: { id },
    include: { ruoli: { include: { ruolo: true } }, tecnico: true },
  });
  if (!current) throw notFound("Utente non trovato");
  if (id === actor.id && input.attivo === false) throw badRequest("Non puoi disattivare il tuo stesso account");
  const data = {
    ...(input.nome === undefined ? {} : { nome: input.nome }),
    ...(input.cognome === undefined ? {} : { cognome: input.cognome }),
    ...(input.attivo === undefined ? {} : { attivo: input.attivo }),
  };
  const updated = await db.$transaction(async (tx) => {
    if (input.ruolo) {
      const role = await tx.ruolo.findUnique({ where: { nome: input.ruolo } });
      if (!role) throw badRequest("Ruolo non presente nel database");
      await tx.utenteRuolo.deleteMany({ where: { utenteId: id } });
      await tx.utenteRuolo.create({ data: { utenteId: id, ruoloId: role.id } });
      if (input.ruolo === "Tecnico") {
        if (!input.specializzazione && !current.tecnico?.specializzazione) {
          throw badRequest("La specializzazione è obbligatoria per un tecnico");
        }
        await tx.tecnico.upsert({
          where: { utenteId: id },
          create: {
            utenteId: id,
            tipo: input.tipoTecnico ?? "interno",
            specializzazione: input.specializzazione!,
            azienda: input.azienda || null,
          },
          update: {
            ...(input.tipoTecnico ? { tipo: input.tipoTecnico } : {}),
            ...(input.specializzazione === undefined ? {} : { specializzazione: input.specializzazione }),
            ...(input.azienda === undefined ? {} : { azienda: input.azienda }),
          },
        });
      } else if (current.tecnico) {
        const [assignments, interventions] = await Promise.all([
          tx.assegnazione.count({ where: { tecnicoId: id } }),
          tx.intervento.count({ where: { tecnicoId: id } }),
        ]);
        if (assignments || interventions) {
          throw conflict("Non puoi rimuovere il ruolo Tecnico: esistono assegnazioni o interventi storici");
        }
        await tx.tecnico.delete({ where: { utenteId: id } });
      }
    } else if (current.tecnico && (input.specializzazione || input.tipoTecnico || input.azienda !== undefined)) {
      await tx.tecnico.update({
        where: { utenteId: id },
        data: {
          ...(input.tipoTecnico ? { tipo: input.tipoTecnico } : {}),
          ...(input.specializzazione ? { specializzazione: input.specializzazione } : {}),
          ...(input.azienda === undefined ? {} : { azienda: input.azienda }),
        },
      });
    }
    return tx.utente.update({
      where: { id },
      data,
      select: {
        id: true, nome: true, cognome: true, email: true, attivo: true,
        ruoli: { select: { ruolo: { select: { nome: true } } } },
        tecnico: { select: { tipo: true, azienda: true, specializzazione: true } },
      },
    });
  });
  await audit(actor.id, input.attivo === false ? "DISATTIVAZIONE" : "MODIFICA", "utente", id, current, updated);
  return updated;
}

export async function listTecnici() {
  const technicians = await db.tecnico.findMany({
    where: {
      utente: {
        attivo: true,
        ruoli: { some: { ruolo: { nome: "Tecnico" } } },
      },
    },
    include: {
      utente: { select: { id: true, nome: true, cognome: true, email: true } },
      assegnazioni: { where: { archivedAt: null }, select: { id: true } },
    },
    orderBy: { utente: { cognome: "asc" } },
  });
  return technicians.map(({ assegnazioni, ...technician }) => ({
    ...technician,
    interventiAttivi: assegnazioni.length,
  }));
}

export async function updateTecnico(id: number, input: UtenteUpdateInput, actor: CurrentUser) {
  const technician = await db.tecnico.findUnique({ where: { utenteId: id } });
  if (!technician) throw notFound("Tecnico non trovato");
  return updateUtente(id, { ...input, ruolo: "Tecnico" }, actor);
}

export async function archiveTecnico(id: number, actor: CurrentUser) {
  const technician = await db.tecnico.findUnique({ where: { utenteId: id } });
  if (!technician) throw notFound("Tecnico non trovato");
  return updateUtente(id, { attivo: false }, actor);
}

export async function listTransizioni() {
  return db.statoTransizione.findMany({
    where: { daStato: { archivedAt: null }, aStato: { archivedAt: null } },
    include: { daStato: true, aStato: true },
    orderBy: [{ daStato: { ordine: "asc" } }, { aStato: { ordine: "asc" } }],
  });
}

export function listStati() {
  return db.stato.findMany({
    where: { archivedAt: null },
    orderBy: { ordine: "asc" },
  });
}

export async function createStato(input: StatoInput, user: CurrentUser) {
  const state = await db.stato.create({ data: input });
  await audit(user.id, "CREAZIONE", "stato", state.id, undefined, state);
  return state;
}

export async function updateStato(id: number, input: StatoInput, user: CurrentUser) {
  const current = await db.stato.findUnique({ where: { id } });
  if (!current || current.archivedAt) throw notFound("Stato non trovato");
  if (current.nome === "Segnalato" && input.nome !== current.nome) {
    throw badRequest("Lo stato iniziale Segnalato non può essere rinominato");
  }
  const updated = await db.stato.update({ where: { id }, data: input });
  await audit(user.id, "MODIFICA", "stato", id, current, updated);
  return updated;
}

export async function archiveStato(id: number, user: CurrentUser) {
  const current = await db.stato.findUnique({ where: { id } });
  if (!current || current.archivedAt) throw notFound("Stato non trovato");
  if (current.nome === "Segnalato") throw badRequest("Lo stato iniziale non può essere archiviato");
  const [used, transitions] = await Promise.all([
    db.segnalazione.count({ where: { statoId: id } }),
    db.statoTransizione.count({ where: { OR: [{ daStatoId: id }, { aStatoId: id }] } }),
  ]);
  if (used || transitions) throw conflict("Rimuovi prima le transizioni e verifica le segnalazioni collegate");
  const updated = await db.stato.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(user.id, "ARCHIVIAZIONE", "stato", id, current, updated);
  return updated;
}

export async function createTransizione(input: TransizioneInput, user: CurrentUser) {
  if (input.daStatoId === input.aStatoId) throw badRequest("Uno stato non può transitare verso sé stesso");
  const [from, to] = await Promise.all([
    db.stato.findFirst({ where: { id: input.daStatoId, archivedAt: null } }),
    db.stato.findFirst({ where: { id: input.aStatoId, archivedAt: null } }),
  ]);
  if (!from || !to) throw badRequest("Gli stati della transizione devono essere attivi");
  if (from.isFinale) throw badRequest("Uno stato finale non può avere transizioni in uscita");
  const transition = await db.statoTransizione.create({
    data: { daStatoId: input.daStatoId, aStatoId: input.aStatoId },
    include: { daStato: true, aStato: true },
  });
  await audit(user.id, "CREAZIONE", "stato_transizione", transition.id, undefined, transition);
  return transition;
}

export async function archiveTransizione(id: number, user: CurrentUser) {
  const transition = await db.statoTransizione.findUnique({
    where: { id },
    include: { daStato: true, aStato: true },
  });
  if (!transition) throw notFound("Transizione non trovata");
  await db.statoTransizione.delete({ where: { id } });
  await audit(user.id, "ELIMINAZIONE", "stato_transizione", id, transition);
  return { id };
}

export async function updateSegnalazione(id: number, input: SegnalazioneUpdateInput, user: CurrentUser) {
  const current = await db.segnalazione.findFirst({ where: { id, archivedAt: null } });
  if (!current) throw notFound("Segnalazione non trovata");
  if (
    user.ruoli.includes("Segnalatore") &&
    !user.ruoli.some((role) => role === "Responsabile manutenzione" || role === "Amministratore") &&
    current.segnalatoreId !== user.id
  ) {
    throw forbidden();
  }
  if (input.categoriaId) {
    const category = await db.categoria.findFirst({ where: { id: input.categoriaId, attiva: true } });
    if (!category) throw badRequest("Categoria inesistente o non attiva");
  }
  if (input.luogoId) {
    const place = await db.luogo.findFirst({ where: { id: input.luogoId, archivedAt: null } });
    if (!place) throw badRequest("Luogo inesistente o archiviato");
  }
  const updated = await db.segnalazione.update({ where: { id }, data: input });
  await audit(user.id, "MODIFICA", "segnalazione", id, current, updated);
  return updated;
}

export async function archiveSegnalazione(id: number, motivo: string, user: CurrentUser) {
  const current = await db.segnalazione.findFirst({ where: { id, archivedAt: null } });
  if (!current) throw notFound("Segnalazione non trovata o già archiviata");
  const archived = await db.segnalazione.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(user.id, "ARCHIVIAZIONE", "segnalazione", id, current, { ...archived, motivo });
  return { id, archivedAt: archived.archivedAt };
}

export async function createNota(segnalazioneId: number, input: NotaInput, user: CurrentUser) {
  const report = await db.segnalazione.findFirst({ where: { id: segnalazioneId, archivedAt: null } });
  if (!report) throw notFound("Segnalazione non trovata o archiviata");
  const note = await db.notaTecnica.create({
    data: { segnalazioneId, testo: input.testo, autoreId: user.id },
    include: { autore: { select: { id: true, nome: true, cognome: true } } },
  });
  await audit(user.id, "CREAZIONE", "nota_tecnica", note.id, undefined, { segnalazioneId, testo: input.testo });
  return note;
}

export async function updateNota(id: number, input: NotaInput, user: CurrentUser) {
  const current = await db.notaTecnica.findFirst({ where: { id, archivedAt: null } });
  if (!current) throw notFound("Nota non trovata o archiviata");
  if (current.autoreId !== user.id && !user.ruoli.includes("Amministratore") && !user.ruoli.includes("Responsabile manutenzione")) {
    throw forbidden();
  }
  const updated = await db.notaTecnica.update({ where: { id }, data: { testo: input.testo } });
  await audit(user.id, "MODIFICA", "nota_tecnica", id, current, updated);
  return updated;
}

export function listNote(segnalazioneId: number) {
  return db.notaTecnica.findMany({
    where: { segnalazioneId, archivedAt: null, segnalazione: { archivedAt: null } },
    include: { autore: { select: { id: true, nome: true, cognome: true } } },
    orderBy: { dataInserimento: "asc" },
  });
}

export async function archiveNota(id: number, user: CurrentUser) {
  const note = await db.notaTecnica.findFirst({ where: { id, archivedAt: null } });
  if (!note) throw notFound("Nota non trovata o già archiviata");
  if (
    note.autoreId !== user.id &&
    !user.ruoli.includes("Amministratore") &&
    !user.ruoli.includes("Responsabile manutenzione")
  ) {
    throw forbidden();
  }
  const archived = await db.notaTecnica.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(user.id, "ARCHIVIAZIONE", "nota_tecnica", id, note, archived);
  return { id, archivedAt: archived.archivedAt };
}

export async function createAssegnazione(
  segnalazioneId: number,
  input: AssegnazioneInput,
  user: CurrentUser,
) {
  const [report, technician] = await Promise.all([
    db.segnalazione.findFirst({ where: { id: segnalazioneId, archivedAt: null } }),
    db.tecnico.findFirst({ where: { utenteId: input.tecnicoId, utente: { attivo: true } } }),
  ]);
  if (!report) throw notFound("Segnalazione non trovata o archiviata");
  if (!technician) throw badRequest("Tecnico inesistente o disattivato");
  const previousAssignment = await db.assegnazione.findFirst({
    where: { segnalazioneId, tecnicoId: input.tecnicoId },
  });
  if (previousAssignment?.archivedAt === null) {
    throw conflict("Il tecnico è già assegnato a questa segnalazione");
  }
  const assignment = previousAssignment
    ? await db.assegnazione.update({
        where: { id: previousAssignment.id },
        data: { archivedAt: null, responsabileId: user.id, dataAssegnazione: new Date() },
        include: { tecnico: { include: { utente: { select: { id: true, nome: true, cognome: true } } } } },
      })
    : await db.assegnazione.create({
        data: { segnalazioneId, tecnicoId: input.tecnicoId, responsabileId: user.id },
        include: { tecnico: { include: { utente: { select: { id: true, nome: true, cognome: true } } } } },
      });
  await audit(user.id, "ASSEGNAZIONE", "assegnazione", assignment.id, undefined, assignment);
  return assignment;
}

export function listAssegnazioni(segnalazioneId: number) {
  return db.assegnazione.findMany({
    where: { segnalazioneId, archivedAt: null, segnalazione: { archivedAt: null } },
    include: {
      tecnico: { include: { utente: { select: { id: true, nome: true, cognome: true } } } },
      responsabile: { select: { id: true, nome: true, cognome: true } },
    },
    orderBy: { dataAssegnazione: "desc" },
  });
}

export async function archiveAssegnazione(id: number, user: CurrentUser) {
  const assignment = await db.assegnazione.findFirst({ where: { id, archivedAt: null } });
  if (!assignment) throw notFound("Assegnazione non trovata o già archiviata");
  const archived = await db.assegnazione.update({ where: { id }, data: { archivedAt: new Date() } });
  await audit(user.id, "ARCHIVIAZIONE", "assegnazione", id, assignment, archived);
  return { id, archivedAt: archived.archivedAt };
}

export async function getRuoli(): Promise<NomeRuolo[]> {
  const roles = await db.ruolo.findMany({ select: { nome: true }, orderBy: { nome: "asc" } });
  return roles.map(({ nome }) => nome as NomeRuolo);
}
