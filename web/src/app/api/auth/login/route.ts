import { login } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { loginSchema } from "@/server/validation/auth";

/**
 * POST /api/auth/login — ACCESSO
 *
 * Chi può chiamarla: chiunque.
 * Body JSON: { email, password }
 * Risposta 200: { token, tokenType: "Bearer", expiresIn (secondi), utente: { id, email, nome, cognome, ruoli } }
 * Il token va inviato nelle richieste successive come `Authorization: Bearer <token>`.
 *
 * Risposte: 200 · 400 dati non validi · 401 credenziali errate (stesso messaggio
 *           per email inesistente e password sbagliata) · 429 troppi tentativi
 */
export const POST = route(async (request) => {
  const { email, password } = loginSchema.parse(await readJson(request));
  return json(await login(email, password));
});
