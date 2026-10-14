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

export const STATO_INIZIALE = "Segnalato";

/** Macchina a stati (docs/backlog.md): stato corrente -> stati raggiungibili. */
const TRANSIZIONI: Record<string, readonly string[]> = {
  Segnalato: ["Preso in carico"],
  "Preso in carico": ["In lavorazione"],
  "In lavorazione": ["Sospeso", "Risolto"],
  Sospeso: ["In lavorazione"],
  Risolto: [],
};

// Mai esporre password_hash: ogni relazione verso Utente passa da qui.
const utentePubblico = { select: { id: true, nome: true, cognome: true, email: true } };

const perLista = {
  stato: true,
  categoria: true,
  luogo: { select: { id: true, nome: true, tipo: true } },
  prioritaProposta: true,
  prioritaAssegnata: true,
  segnalatore: utentePubblico,
} satisfies Prisma.SegnalazioneInclude;

const perDettaglio = {
  ...perLista,
  assegnazioni: {
    include: {
      tecnico: { include: { utente: utentePubblico } },
      responsabile: utentePubblico,
    },
    orderBy: { dataAssegnazione: "desc" },
  },
  storicoStati: {
    include: { statoPrecedente: true, statoNuovo: true, modificatoDa: utentePubblico },
    orderBy: { dataCambio: "asc" },
  },
  noteTecniche: { include: { autore: utentePubblico }, orderBy: { dataInserimento: "asc" } },
  allegati: true,
} satisfies Prisma.SegnalazioneInclude;

export async function listSegnalazioni(f: FiltriSegnalazioni) {
  const where: Prisma.SegnalazioneWhereInput = {
    statoId: f.statoId,
    categoriaId: f.categoriaId,
    luogoId: f.luogoId,
    dataCreazione: f.dal || f.al ? { gte: f.dal, lte: f.al } : undefined,
    assegnazioni: f.tecnicoId ? { some: { tecnicoId: f.tecnicoId } } : undefined,
    OR: f.q
      ? [
          { titolo: { contains: f.q, mode: "insensitive" } },
          { descrizione: { contains: f.q, mode: "insensitive" } },
        ]
      : undefined,
  };

  const [items, total] = await Promise.all([
    db.segnalazione.findMany({
      where,
      include: perLista,
      orderBy: { dataCreazione: "desc" },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    db.segnalazione.count({ where }),
  ]);

  return { items, total, page: f.page, pageSize: f.pageSize };
}

export async function getSegnalazione(id: number) {
  const segnalazione = await db.segnalazione.findUnique({ where: { id }, include: perDettaglio });
  if (!segnalazione) throw notFound("Segnalazione non trovata");
  return segnalazione;
}

export async function creaSegnalazione(input: CreaSegnalazioneInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    const statoIniziale = await tx.stato.findUnique({ where: { nome: STATO_INIZIALE } });
    if (!statoIniziale) throw new Error(`Stato "${STATO_INIZIALE}" mancante: eseguire il seed`);

    const categoria = await tx.categoria.findUnique({ where: { id: input.categoriaId } });
    if (!categoria?.attiva) throw badRequest("Categoria inesistente o non attiva");

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
      include: perLista,
    });

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

export async function cambiaStato(id: number, input: CambiaStatoInput, user: CurrentUser) {
  return db.$transaction(async (tx) => {
    const corrente = await tx.segnalazione.findUnique({ where: { id }, include: { stato: true } });
    if (!corrente) throw notFound("Segnalazione non trovata");

    const nuovo = await tx.stato.findUnique({ where: { id: input.statoId } });
    if (!nuovo) throw badRequest("Stato di destinazione inesistente");

    const ammessi = TRANSIZIONI[corrente.stato.nome] ?? [];
    if (!ammessi.includes(nuovo.nome)) {
      throw badRequest(`Transizione non ammessa: "${corrente.stato.nome}" → "${nuovo.nome}"`, {
        ammessi,
      });
    }

    // Lock ottimistico: se nel frattempo qualcun altro ha cambiato lo stato,
    // la condizione su statoId non trova righe e non sovrascriviamo nulla.
    const { count } = await tx.segnalazione.updateMany({
      where: { id, statoId: corrente.statoId },
      data: { statoId: nuovo.id, dataChiusura: nuovo.isFinale ? new Date() : null },
    });
    if (count === 0) throw conflict("La segnalazione è stata modificata da un altro utente, ricaricare");

    await tx.storicoStato.create({
      data: {
        segnalazioneId: id,
        statoPrecedenteId: corrente.statoId,
        statoNuovoId: nuovo.id,
        motivo: input.motivo,
        modificatoDaId: user.id,
      },
    });

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

    return tx.segnalazione.findUniqueOrThrow({ where: { id }, include: perLista });
  });
}

export function transizioniAmmesse(nomeStato: string) {
  return TRANSIZIONI[nomeStato] ?? [];
}
