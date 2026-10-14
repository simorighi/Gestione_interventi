import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, conflict, notFound } from "../errors";
import type { CurrentUser } from "../auth";
import type {
  CambiaStatoInput,
  CreaSegnalazioneInput,
  FiltriSegnalazioni,
} from "../validation/segnalazioni";

// SERVICE DELLE SEGNALAZIONI
// Qui sta la logica di business: le route chiamano queste funzioni passando dati già validati.
// Le funzioni non sanno nulla di HTTP: lanciano errori (notFound, badRequest...) che il
// wrapper `route()` trasforma nella risposta con lo status giusto.

/** Nome dello stato in cui nasce ogni segnalazione (deve esistere nella tabella `stato`). */
export const STATO_INIZIALE = "Segnalato";

/**
 * MACCHINA A STATI (dal backlog): per ogni stato, gli stati in cui si può passare.
 * Per cambiare il workflow basta modificare questa mappa.
 * I nomi devono coincidere esattamente con la colonna `nome` della tabella `stato`.
 */
const TRANSIZIONI: Record<string, readonly string[]> = {
  Segnalato: ["Preso in carico"],
  "Preso in carico": ["In lavorazione"],
  "In lavorazione": ["Sospeso", "Risolto"],
  Sospeso: ["In lavorazione"],
  Risolto: [], // stato finale: da qui non si esce
};

// ---------------------------------------------------------------------------
// Cosa caricare insieme alla segnalazione (le "include" di Prisma = le JOIN in SQL)
// ---------------------------------------------------------------------------

// Quando includiamo un utente prendiamo solo questi campi:
// così password_hash non finisce mai in una risposta API.
const utentePubblico = { select: { id: true, nome: true, cognome: true, email: true } };

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
export async function listSegnalazioni(f: FiltriSegnalazioni) {
  // Costruisce la WHERE. Un filtro `undefined` viene ignorato da Prisma,
  // quindi i filtri non passati nell'URL semplicemente non si applicano.
  const where: Prisma.SegnalazioneWhereInput = {
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
 * Carica una segnalazione con tutte le relazioni; se non esiste → 404.
 */
export async function getSegnalazione(id: number) {
  const segnalazione = await db.segnalazione.findUnique({ where: { id }, include: perDettaglio });
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
    const ammessi = TRANSIZIONI[corrente.stato.nome] ?? [];
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
 * Usata da GET /api/segnalazioni/:id
 * Dato il nome di uno stato, restituisce i nomi degli stati raggiungibili da lì.
 */
export function transizioniAmmesse(nomeStato: string) {
  return TRANSIZIONI[nomeStato] ?? [];
}
