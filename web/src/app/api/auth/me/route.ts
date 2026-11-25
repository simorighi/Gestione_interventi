import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";

/**
 * GET /api/auth/me — UTENTE CORRENTE
 * Restituisce l'utente del token (id, email, nome, cognome, ruoli). 401 se il token manca o non è valido.
 * Il frontend la usa all'avvio per sapere se la sessione salvata è ancora valida.
 */
export const GET = route(async (request) => json(await getCurrentUser(request)));
