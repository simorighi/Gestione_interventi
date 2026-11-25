import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { listStati } from "@/server/services/anagrafiche.service";

// GET /api/stati — gli stati del workflow nell'ordine in cui si attraversano.
// Chi può chiamarla: qualunque utente autenticato (401 senza token). L'id serve come statoId nei filtri e nel cambio di stato.
// Risposta 200: [{ id, nome, ordine, isFinale }, ...]
export const GET = route(async (request) => {
  await getCurrentUser(request);
  return json(await listStati());
});
