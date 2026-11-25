import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";
import { listCategorie } from "@/server/services/anagrafiche.service";

// GET /api/categorie — elenco delle categorie attive, in ordine alfabetico.
// Chi può chiamarla: qualunque utente autenticato (401 senza token). Serve per il menu "categoria" quando si crea una segnalazione.
// Risposta 200: [{ id, nome, descrizione, attiva }, ...]
export const GET = route(async (request) => {
  await getCurrentUser(request);
  return json(await listCategorie());
});
