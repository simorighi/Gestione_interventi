import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { assegnaTecnici } from "@/server/services/segnalazioni.service";
import { assegnaTecniciSchema, idParam } from "@/server/validation/segnalazioni";

/**
 * POST /api/segnalazioni/:id/assegnazioni — ASSEGNA UNO O PIÙ TECNICI (backlog voce 4)
 *
 * Chi può chiamarla: Responsabile manutenzione, Amministratore.
 * Body JSON: { tecnicoIds: number[] }   ← id utente dei tecnici (da GET /api/tecnici)
 *
 * Cosa succede: crea un'assegnazione per ogni tecnico, registrando chi l'ha fatta,
 * e una riga di log_audit "ASSEGNAZIONE" per ciascuna, tutto in una transazione.
 *
 * Risposte: 201 segnalazione aggiornata (con le assegnazioni) · 400 dati non validi,
 *           tecnico inesistente o segnalazione chiusa · 401 · 403 ruolo non ammesso
 *           404 segnalazione inesistente · 409 tecnico già assegnato
 */
export const POST = route<RouteContext<"/api/segnalazioni/[id]/assegnazioni">>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);

  const { id } = idParam.parse(await ctx.params);
  const input = assegnaTecniciSchema.parse(await readJson(request));

  return json(await assegnaTecnici(id, input, user), { status: 201 });
});
