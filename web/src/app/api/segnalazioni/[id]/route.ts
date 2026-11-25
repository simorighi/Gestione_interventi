import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { getSegnalazione, transizioniAmmesse } from "@/server/services/segnalazioni.service";
import { idParam } from "@/server/validation/segnalazioni";

// Questo file risponde all'URL /api/segnalazioni/:id
// La cartella [id] è un "segmento dinamico": in /api/segnalazioni/5 il valore 5 arriva in ctx.params.

/**
 * GET /api/segnalazioni/:id — DETTAGLIO DI UNA SEGNALAZIONE
 *
 * Chi può chiamarla: utente autenticato che può vedere la segnalazione (stesse regole della lista).
 * Esempio: /api/segnalazioni/5
 *
 * Risposta 200: la segnalazione con tutto quello che le è collegato
 *   - stato, categoria, luogo, priorità, segnalatore
 *   - assegnazioni (quali tecnici, assegnati da chi)
 *   - storicoStati (tutti i cambi di stato in ordine cronologico)
 *   - noteTecniche e allegati
 *   - transizioniAmmesse: i nomi degli stati in cui può passare adesso
 *     (utile al frontend per mostrare solo i pulsanti validi)
 *
 * Risposte: 200 · 400 id non numerico · 401 senza token · 404 non esiste o non è di competenza
 */
export const GET = route<RouteContext<"/api/segnalazioni/[id]">>(async (request, ctx) => {
  const user = await getCurrentUser(request);

  // 1. Legge l'id dall'URL e controlla che sia un intero positivo (es. /abc → 400).
  const { id } = idParam.parse(await ctx.params);

  // 2. Carica la segnalazione con le relazioni; se non esiste il service lancia un 404.
  const segnalazione = await getSegnalazione(id, user);

  // 3. Aggiunge alla risposta gli stati raggiungibili da quello attuale.
  return json({
    ...segnalazione,
    transizioniAmmesse: transizioniAmmesse(segnalazione.stato.nome),
  });
});
