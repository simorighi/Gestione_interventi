import { json, route } from "@/server/http";
import { listCategorie } from "@/server/services/anagrafiche.service";

// GET /api/categorie — elenco delle categorie attive, in ordine alfabetico.
// Chi può chiamarla: chiunque. Serve per il menu "categoria" quando si crea una segnalazione.
// Risposta 200: [{ id, nome, descrizione, attiva }, ...]
export const GET = route(async () => json(await listCategorie()));
