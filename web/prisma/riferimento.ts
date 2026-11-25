// DATI DI RIFERIMENTO (ruoli, stati, priorità, categorie).
// Su Supabase esistono già; servono per inizializzare un database vuoto
// (database dei test, nuovo ambiente). Ogni tabella viene riempita SOLO se è
// vuota: rilanciare non duplica nulla e non tocca dati già presenti.
import type { PrismaClient } from "../src/generated/prisma/client";

export const RUOLI = ["Segnalatore", "Tecnico", "Responsabile manutenzione", "Amministratore"];

// L'ordine segue il workflow in src/server/workflow.ts.
export const STATI = [
  { nome: "Segnalato", ordine: 1, isFinale: false },
  { nome: "Preso in carico", ordine: 2, isFinale: false },
  { nome: "In lavorazione", ordine: 3, isFinale: false },
  { nome: "Sospeso", ordine: 4, isFinale: false },
  { nome: "Risolto", ordine: 5, isFinale: true },
];

export const PRIORITA = [
  { nome: "Bassa", livello: 1 },
  { nome: "Media", livello: 2 },
  { nome: "Alta", livello: 3 },
  { nome: "Urgente", livello: 4 },
];

export const CATEGORIE = [
  { nome: "Elettrico", descrizione: "Impianto elettrico e illuminazione" },
  { nome: "Idraulico", descrizione: "Impianto idrico e sanitari" },
  { nome: "Climatizzazione", descrizione: "Riscaldamento e condizionamento" },
  { nome: "Edile", descrizione: "Muri, porte, serramenti" },
];

export async function inserisciRiferimento(db: PrismaClient) {
  if ((await db.ruolo.count()) === 0) await db.ruolo.createMany({ data: RUOLI.map((nome) => ({ nome })) });
  if ((await db.stato.count()) === 0) await db.stato.createMany({ data: STATI });
  if ((await db.priorita.count()) === 0) await db.priorita.createMany({ data: PRIORITA });
  if ((await db.categoria.count()) === 0) await db.categoria.createMany({ data: CATEGORIE });
}
