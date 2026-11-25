import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { listPriorita } from "@/server/services/anagrafiche.service";

// GET /api/priorita — elenco delle priorità, dalla più bassa alla più urgente.
// Chi può chiamarla: qualunque utente autenticato (401 senza token). Serve per scegliere la priorità proposta o assegnata.
// Risposta 200: [{ id, nome, livello }, ...]
export const GET = route(async (request) => {
  await getCurrentUser(request);
  return json(await listPriorita());
});
