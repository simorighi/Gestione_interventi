import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, route } from "@/server/http";
import { listTecnici } from "@/server/services/anagrafiche.service";

// GET /api/tecnici — tecnici attivi, per scegliere a chi assegnare una segnalazione.
// Chi può chiamarla: Responsabile manutenzione, Amministratore (403 per gli altri ruoli).
// Risposta 200: [{ id, nome, cognome, tipo, azienda, specializzazione }, ...]
export const GET = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await listTecnici());
});
