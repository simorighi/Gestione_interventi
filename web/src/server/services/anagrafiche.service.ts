import "server-only";
import { db } from "../db";

// "Anagrafiche" = dati di riferimento che cambiano raramente (categorie, priorità, stati, luoghi).
// Servono soprattutto al frontend per riempire menu a tendina e filtri.
// Sono tutte letture semplici: nessuna regola di business, nessuna transazione.

/**
 * Usata da GET /api/categorie
 * Solo le categorie attive (attiva = true), in ordine alfabetico.
 * Una categoria disattivata non si può più scegliere per nuove segnalazioni,
 * ma resta nel DB per quelle vecchie.
 */
export function listCategorie() {
  return db.categoria.findMany({ where: { attiva: true }, orderBy: { nome: "asc" } });
}

/**
 * Usata da GET /api/priorita
 * Tutte le priorità, dalla meno urgente (livello 1) alla più urgente.
 */
export function listPriorita() {
  return db.priorita.findMany({ orderBy: { livello: "asc" } });
}

/**
 * Usata da GET /api/stati
 * Tutti gli stati del workflow nell'ordine in cui si attraversano (campo `ordine`).
 * `isFinale = true` indica lo stato che chiude la segnalazione (Risolto).
 */
export function listStati() {
  return db.stato.findMany({ orderBy: { ordine: "asc" } });
}

/**
 * Usata da GET /api/luoghi
 * Tutti i luoghi come lista piatta: prima gli edifici (padreId = null), poi aree e impianti.
 * La gerarchia si ricostruisce con `padreId` (es. Sala riunioni → Piano 1 → Sede Centrale).
 */
export function listLuoghi() {
  return db.luogo.findMany({
    orderBy: [{ padreId: { sort: "asc", nulls: "first" } }, { nome: "asc" }],
  });
}
