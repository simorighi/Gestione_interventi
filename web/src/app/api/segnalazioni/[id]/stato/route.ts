import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { cambiaStato } from "@/server/services/segnalazioni.service";
import { cambiaStatoSchema, idParam } from "@/server/validation/segnalazioni";

// Questo file risponde all'URL /api/segnalazioni/:id/stato

/**
 * PATCH /api/segnalazioni/:id/stato — CAMBIA LO STATO DI UNA SEGNALAZIONE
 *
 * Chi può chiamarla: Tecnico, Responsabile manutenzione, Amministratore
 *   (header obbligatorio `x-user-id`).
 * Body JSON:
 *   { statoId, motivo? }   ← statoId obbligatorio, motivo facoltativo (finisce nello storico)
 *
 * Il workflow consentito è:
 *   Segnalato → Preso in carico → In lavorazione → Sospeso / Risolto
 *   Sospeso → In lavorazione
 * Qualsiasi altro salto (es. Segnalato → Risolto) viene rifiutato con 400.
 * Passando a uno stato finale (Risolto) viene impostata la data di chiusura.
 * Ogni cambio scrive una riga in storico_stato e una in log_audit.
 *
 * Risposte: 200 aggiornata · 400 transizione non ammessa o dati non validi
 *           401 manca l'utente · 403 ruolo non ammesso · 404 non esiste
 *           409 qualcun altro l'ha modificata nello stesso momento
 */
export const PATCH = route<RouteContext<"/api/segnalazioni/[id]/stato">>(async (request, ctx) => {
  // 1. Chi sta facendo la richiesta?
  const user = await getCurrentUser(request);

  // 2. Ha il permesso? Il Segnalatore NON può cambiare lo stato → 403.
  requireRole(user, RUOLI.TECNICO, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);

  // 3. Valida l'id nell'URL e il body.
  const { id } = idParam.parse(await ctx.params);
  const input = cambiaStatoSchema.parse(await readJson(request));

  // 4. Il service controlla il workflow e salva; risponde con la segnalazione aggiornata.
  return json(await cambiaStato(id, input, user));
});
