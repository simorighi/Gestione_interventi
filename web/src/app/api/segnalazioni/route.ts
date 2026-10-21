import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route, searchParams } from "@/server/http";
import { creaSegnalazione, listSegnalazioni } from "@/server/services/segnalazioni.service";
import {
  creaSegnalazioneSchema,
  filtriSegnalazioniSchema,
} from "@/server/validation/segnalazioni";

// Questo file risponde all'URL /api/segnalazioni.
// Ogni funzione esportata con il nome di un metodo HTTP (GET, POST...) gestisce quel metodo.
// `route(...)` avvolge l'handler: se qualcosa lancia un errore, lo trasforma in JSON con lo status giusto.

/**
 * GET /api/segnalazioni — ELENCO DELLE SEGNALAZIONI
 *
 * Chi può chiamarla: chiunque (nessun header richiesto).
 * Filtri opzionali nella query string, combinabili tra loro:
 *   statoId, categoriaId, luogoId, tecnicoId, dal, al (date), q (testo), page, pageSize
 * Esempio: /api/segnalazioni?statoId=1&q=luci&page=1&pageSize=10
 *
 * Risposta 200: { items: [...], total, page, pageSize }
 *   - items: le segnalazioni della pagina richiesta, dalla più recente
 *   - total: quante segnalazioni rispettano i filtri in totale (serve per la paginazione)
 */
export const GET = route(async (request) => {
  // 1. Legge i parametri dall'URL e li valida (es. statoId=abc → errore 400).
  //    zod converte anche i tipi: "1" diventa il numero 1, "2026-10-01" una data.
  const filtri = filtriSegnalazioniSchema.parse(searchParams(request));

  // 2. Il service costruisce la query e interroga il database.
  return json(await listSegnalazioni(filtri));
});

/**
 * POST /api/segnalazioni — CREA UNA NUOVA SEGNALAZIONE
 *
 * Chi può chiamarla: Segnalatore, Responsabile manutenzione, Amministratore
 *   (header obbligatorio `x-user-id`; il segnalatore registrato è l'utente dell'header).
 * Body JSON:
 *   { titolo, descrizione, luogoId, categoriaId, prioritaPropostaId }   ← tutti obbligatori
 *
 * Cosa succede: la segnalazione nasce nello stato "Segnalato", viene scritta la prima riga
 * dello storico stati e una riga nel log di audit.
 *
 * Risposte: 201 creata · 400 dati non validi · 401 manca l'utente · 403 ruolo non ammesso
 */
export const POST = route(async (request) => {
  // 1. Chi sta facendo la richiesta? (legge x-user-id e carica l'utente con i suoi ruoli)
  const user = await getCurrentUser(request);

  // 2. Ha il permesso? Se non ha almeno uno di questi ruoli → 403.
  requireRole(user, RUOLI.SEGNALATORE, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);

  // 3. Il body è valido? (campi presenti, lunghezze, id numerici) altrimenti → 400.
  const input = creaSegnalazioneSchema.parse(await readJson(request));

  // 4. Il service salva tutto nel database; rispondiamo 201 Created con la segnalazione creata.
  return json(await creaSegnalazione(input, user), { status: 201 });
});
