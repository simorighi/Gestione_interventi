import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { getSegnalazione, transizioniAmmesse } from "@/server/services/segnalazioni.service";
import { idParam } from "@/server/validation/segnalazioni";
import { archiveSegnalazione, updateSegnalazione } from "@/server/services/gestione.service";
import { annullaSchema, segnalazioneUpdateSchema } from "@/server/validation/gestione";

// Questo file risponde all'URL /api/segnalazioni/:id
// La cartella [id] è un "segmento dinamico": in /api/segnalazioni/5 il valore 5 arriva in ctx.params.

/**
 * GET /api/segnalazioni/:id — DETTAGLIO DI UNA SEGNALAZIONE
 *
 * Chi può chiamarla: chiunque (nessun header richiesto).
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
 * Risposte: 200 · 400 id non numerico · 404 non esiste
 */
export const GET = route<RouteContext<"/api/segnalazioni/[id]">>(async (request, ctx) => {
  await getCurrentUser(request);
  // 1. Legge l'id dall'URL e controlla che sia un intero positivo (es. /abc → 400).
  const { id } = idParam.parse(await ctx.params);

  // 2. Carica la segnalazione con le relazioni; se non esiste il service lancia un 404.
  const segnalazione = await getSegnalazione(id);

  // 3. Aggiunge alla risposta gli stati raggiungibili da quello attuale.
  return json({
    ...segnalazione,
    transizioniAmmesse: await transizioniAmmesse(segnalazione.statoId),
  });
});

type Ctx = RouteContext<"/api/segnalazioni/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.SEGNALATORE, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateSegnalazione(id, segnalazioneUpdateSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  const { motivo } = annullaSchema.parse(await readJson(request));
  return json(await archiveSegnalazione(id, motivo, user));
});
