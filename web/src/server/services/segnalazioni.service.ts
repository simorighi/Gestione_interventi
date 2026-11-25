import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { AppError, badRequest, conflict, notFound } from "../errors";
import { haRuolo, RUOLI, type CurrentUser } from "../auth";
import { STATO_INIZIALE, transizioniAmmesse } from "../workflow";
import type {
  AssegnaTecniciInput,
  CambiaStatoInput,
  CreaSegnalazioneInput,
  FiltriSegnalazioni,
} from "../validation/segnalazioni";

// SERVICE DELLE SEGNALAZIONI
// Qui sta la logica di business: le route chiamano queste funzioni passando dati già validati.
// Le funzioni non sanno nulla di HTTP: lanciano errori (notFound, badRequest...) che il
// wrapper `route()` trasforma nella risposta con lo status giusto.

// ---------------------------------------------------------------------------
// Cosa caricare insieme alla segnalazione (le "include" di Prisma = le JOIN in SQL)
// ---------------------------------------------------------------------------

// Quando includiamo un utente prendiamo solo questi campi: password_hash non
// finisce mai in una risposta API, e nemmeno l'email (dato personale che a chi
// guarda una segnalazione non serve; ognuno vede la propria con /api/auth/me).
const utentePubblico = { select: { id: true, nome: true, cognome: true } };

// ---------------------------------------------------------------------------
// Visibilità (chi vede cosa) — applicata nella query, non solo nell'interfaccia
// ---------------------------------------------------------------------------

/**
 * Condizione WHERE con le segnalazioni che `user` può vedere:
 *  - Responsabile manutenzione e Amministratore: tutte (undefined = nessun filtro);
 *  - Tecnico: quelle assegnate a lui (backlog voce 6, bug-report-42);
 *  - Segnalatore: quelle che ha creato.
 * Con più ruoli vale l'unione.
 */
export function filtroVisibilita(user: CurrentUser): Prisma.SegnalazioneWhereInput | undefined {
  if (haRuolo(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE)) return undefined;
  const condizioni: Prisma.SegnalazioneWhereInput[] = [];
  if (haRuolo(user, RUOLI.TECNICO)) condizioni.push({ assegnazioni: { some: { tecnicoId: user.id } } });
  if (haRuolo(user, RUOLI.SEGNALATORE)) condizioni.push({ segnalatoreId: user.id });
  // Utente senza ruoli operativi: non vede niente (id impossibile).
  return condizioni.length > 0 ? { OR: condizioni } : { id: -1 };
}

// Per l'ELENCO: solo i dati che servono a mostrare una riga di tabella.
const perLista = {
  stato: true,
  categoria: true,
  luogo: { select: { id: true, nome: true, tipo: true } },
  prioritaProposta: true,
  prioritaAssegnata: true,
  segnalatore: utentePubblico,
} satisfies Prisma.SegnalazioneInclude;

// Per il DETTAGLIO: tutto quello della lista + storia completa della segnalazione.
const perDettaglio = {
  ...perLista,
  assegnazioni: {
    include: {
      tecnico: { include: { utente: utentePubblico } }, // tecnico → i suoi dati anagrafici
      responsabile: utentePubblico, // chi ha fatto l'assegnazione
    },
    orderBy: { dataAssegnazione: "desc" }, // la più recente per prima
  },
  storicoStati: {
    include: { statoPrecedente: true, statoNuovo: true, modificatoDa: utentePubblico },
    orderBy: { dataCambio: "asc" }, // in ordine cronologico, dalla creazione a oggi
  },
  noteTecniche: { include: { autore: utentePubblico }, orderBy: { dataInserimento: "asc" } },
  allegati: true,
} satisfies Prisma.SegnalazioneInclude;

// ---------------------------------------------------------------------------
// Funzioni chiamate dalle route
// ---------------------------------------------------------------------------

/**
 * Usata da GET /api/segnalazioni
 * Cerca le segnalazioni applicando i filtri ricevuti e restituisce una pagina di risultati.
 */
export async function listSegnalazioni(f: FiltriSegnalazioni, user: CurrentUser) {
  // Costruisce la WHERE. Un filtro `undefined` viene ignorato da Prisma,
  // quindi i filtri non passati nell'URL semplicemente non si applicano.
  const filtri: Prisma.SegnalazioneWhereInput = {
    statoId: f.statoId,
    categoriaId: f.categoriaId,
    luogoId: f.luogoId,
    // Periodo: data di creazione compresa tra `dal` e `al` (anche uno solo dei due).
    dataCreazione: f.dal || f.al ? { gte: f.dal, lte: f.al } : undefined,
    // Tecnico: segnalazioni che hanno ALMENO UNA assegnazione a quel tecnico.
    assegnazioni: f.tecnicoId ? { some: { tecnicoId: f.tecnicoId } } : undefined,
    // Testo libero: cerca in titolo O descrizione, senza distinguere maiuscole/minuscole.
    OR: f.q
      ? [
          { titolo: { contains: f.q, mode: "insensitive" } },
          { descrizione: { contains: f.q, mode: "insensitive" } },
        ]
      : undefined,
  };

  // I filtri dell'utente si combinano (AND) con la visibilità: non possono allargarla.
  const visibilita = filtroVisibilita(user);
  const where: Prisma.SegnalazioneWhereInput = visibilita ? { AND: [filtri, visibilita] } : filtri;

  // Due query in parallelo con gli stessi filtri:
  // - findMany: le righe della pagina richiesta (skip = quante saltarne, take = quante prenderne)
  // - count: il totale, che serve al frontend per sapere quante pagine ci sono
  const [items, total] = await Promise.all([
    db.segnalazione.findMany({
      where,
      include: perLista,
      orderBy: { dataCreazione: "desc" }, // le più recenti per prime
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    db.segnalazione.count({ where }),
  ]);

  return { items, total, page: f.page, pageSize: f.pageSize };
}

/**
 * Usata da GET /api/segnalazioni/:id
 * Carica una segnalazione con tutte le relazioni; se non esiste o non è visibile a `user` → 404.
 */
export async function getSegnalazione(id: number, user: CurrentUser) {
  // Una segnalazione che l'utente non può vedere risponde 404 come se non esistesse:
  // con un 403 si confermerebbe che quell'id esiste.
  const visibilita = filtroVisibilita(user);
  const segnalazione = await db.segnalazione.findFirst({
    where: visibilita ? { AND: [{ id }, visibilita] } : { id },
    include: perDettaglio,
  });
  if (!segnalazione) throw notFound("Segnalazione non trovata");
  return segnalazione;
}

/**
 * Usata da POST /api/segnalazioni
 * Crea la segnalazione nello stato iniziale, registrando storico e audit.
 *
 * Tutto avviene in una TRANSAZIONE (db.$transaction): se un passaggio fallisce,
 * il database annulla anche quelli già fatti. Non può quindi esistere una segnalazione
 * senza la sua riga di storico o di audit.
 * Dentro la transazione si usa `tx` al posto di `db`.
 */
export async function creaSegnalazione(input: CreaSegnalazioneInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    // 1. Recupera lo stato "Segnalato" (serve il suo id). Se manca è un errore di configurazione → 500.
    const statoIniziale = await tx.stato.findUnique({ where: { nome: STATO_INIZIALE } });
    if (!statoIniziale) throw new Error(`Stato "${STATO_INIZIALE}" mancante nella tabella stato`);

    // 2. La categoria deve esistere ed essere attiva. (Luogo e priorità inesistenti invece
    //    vengono bloccati dalle foreign key del DB → 400 "Riferimento a un record inesistente".)
    const categoria = await tx.categoria.findUnique({ where: { id: input.categoriaId } });
    if (!categoria?.attiva) throw badRequest("Categoria inesistente o non attiva");

    // 3. Crea la segnalazione e, nella stessa istruzione, la prima riga di storico_stato
    //    (stato precedente vuoto → "Segnalato"). Il segnalatore è l'utente che fa la richiesta.
    const creata = await tx.segnalazione.create({
      data: {
        titolo: input.titolo,
        descrizione: input.descrizione,
        luogoId: input.luogoId,
        categoriaId: input.categoriaId,
        prioritaPropostaId: input.prioritaPropostaId,
        statoId: statoIniziale.id,
        segnalatoreId: user.id,
        storicoStati: {
          create: { statoNuovoId: statoIniziale.id, modificatoDaId: user.id },
        },
      },
      include: perLista, // la risposta contiene già stato, categoria, luogo... per esteso
    });

    // 4. Registra l'operazione nel log di audit (chi, cosa, quando).
    await tx.logAudit.create({
      data: {
        azione: "CREAZIONE",
        tabellaRiferita: "segnalazione",
        chiaveRiferita: creata.id,
        valoreDopo: JSON.stringify({ titolo: creata.titolo, stato: statoIniziale.nome }),
        utenteId: user.id,
      },
    });

    return creata;
  });
}

/**
 * Usata da PATCH /api/segnalazioni/:id/stato
 * Porta la segnalazione in un nuovo stato, solo se il workflow lo consente.
 * Anche qui tutto in una transazione: aggiornamento + storico + audit, o niente.
 */
export async function cambiaStato(id: number, input: CambiaStatoInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    // 1. Carica la segnalazione con il suo stato attuale; se non esiste → 404.
    const corrente = await tx.segnalazione.findUnique({ where: { id }, include: { stato: true } });
    if (!corrente) throw notFound("Segnalazione non trovata");

    // 2. Lo stato di destinazione deve esistere → altrimenti 400.
    const nuovo = await tx.stato.findUnique({ where: { id: input.statoId } });
    if (!nuovo) throw badRequest("Stato di destinazione inesistente");

    // 3. Il passaggio è consentito dalla macchina a stati? Se no → 400,
    //    e nei details indichiamo quali stati sarebbero ammessi.
    const ammessi = transizioniAmmesse(corrente.stato.nome);
    if (!ammessi.includes(nuovo.nome)) {
      throw badRequest(`Transizione non ammessa: "${corrente.stato.nome}" → "${nuovo.nome}"`, {
        ammessi,
      });
    }

    // 4. Aggiorna lo stato. Se il nuovo stato è finale (Risolto) imposta la data di chiusura.
    //    Lock ottimistico: aggiorniamo SOLO SE lo stato è ancora quello letto al punto 1.
    //    Se nel frattempo un altro utente l'ha cambiato, nessuna riga viene aggiornata
    //    (count = 0) e rispondiamo 409 invece di sovrascrivere la sua modifica.
    const { count } = await tx.segnalazione.updateMany({
      where: { id, statoId: corrente.statoId },
      data: { statoId: nuovo.id, dataChiusura: nuovo.isFinale ? new Date() : null },
    });
    if (count === 0) throw conflict("La segnalazione è stata modificata da un altro utente, ricaricare");

    // 5. Storico: da quale stato a quale, chi l'ha fatto e perché.
    await tx.storicoStato.create({
      data: {
        segnalazioneId: id,
        statoPrecedenteId: corrente.statoId,
        statoNuovoId: nuovo.id,
        motivo: input.motivo,
        modificatoDaId: user.id,
      },
    });

    // 6. Audit: valore prima e dopo, salvati come testo JSON.
    await tx.logAudit.create({
      data: {
        azione: "CAMBIO_STATO",
        tabellaRiferita: "segnalazione",
        chiaveRiferita: id,
        valorePrima: JSON.stringify({ stato: corrente.stato.nome }),
        valoreDopo: JSON.stringify({ stato: nuovo.nome, motivo: input.motivo ?? null }),
        utenteId: user.id,
      },
    });

    // 7. Rilegge la segnalazione aggiornata da restituire al client.
    return tx.segnalazione.findUniqueOrThrow({ where: { id }, include: perLista });
  });
}

/**
 * Usata da POST /api/segnalazioni/:id/assegnazioni (backlog voce 4)
 * Assegna uno o più tecnici a una segnalazione non ancora chiusa.
 * In una transazione: righe di assegnazione + una riga di audit per tecnico.
 * Il "responsabile" registrato è l'utente che fa la richiesta (dal token).
 */
export async function assegnaTecnici(id: number, input: AssegnaTecniciInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    const segnalazione = await tx.segnalazione.findUnique({ where: { id }, include: { stato: true } });
    if (!segnalazione) throw notFound("Segnalazione non trovata");
    if (segnalazione.stato.isFinale) throw badRequest("Segnalazione già chiusa: non si può assegnare");

    // Tutti gli id devono essere tecnici esistenti e attivi.
    const tecnici = await tx.tecnico.findMany({
      where: { utenteId: { in: input.tecnicoIds }, utente: { attivo: true } },
      select: { utenteId: true },
    });
    const trovati = new Set(tecnici.map((t) => t.utenteId));
    const mancanti = input.tecnicoIds.filter((t) => !trovati.has(t));
    if (mancanti.length > 0) throw badRequest("Tecnico inesistente o non attivo", { tecnicoIds: mancanti });

    // Già assegnati → 409 (vincolo uq_assegnazione_segnalazione_tecnico).
    const gia = await tx.assegnazione.findMany({
      where: { segnalazioneId: id, tecnicoId: { in: input.tecnicoIds } },
      select: { tecnicoId: true },
    });
    if (gia.length > 0) {
      throw new AppError(409, "CONFLICT", "Tecnico già assegnato a questa segnalazione", {
        tecnicoIds: gia.map((g) => g.tecnicoId),
      });
    }

    for (const tecnicoId of input.tecnicoIds) {
      const a = await tx.assegnazione.create({ data: { segnalazioneId: id, tecnicoId, responsabileId: user.id } });
      await tx.logAudit.create({
        data: {
          azione: "ASSEGNAZIONE",
          tabellaRiferita: "segnalazione",
          chiaveRiferita: id,
          valoreDopo: JSON.stringify({ assegnazioneId: a.id, tecnicoId }),
          utenteId: user.id,
        },
      });
    }

    return tx.segnalazione.findUniqueOrThrow({ where: { id }, include: perDettaglio });
  });
}

// Riesportata per le route che la usavano da qui.
export { transizioniAmmesse };
