import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "./config";
import { db } from "./db";
import { AppError, forbidden, unauthorized } from "./errors";
import { impostaUtente, log } from "./log";
import { emettiToken, verificaToken } from "./token";

export const RUOLI = {
  SEGNALATORE: "Segnalatore",
  TECNICO: "Tecnico",
  RESPONSABILE: "Responsabile manutenzione",
  AMMINISTRATORE: "Amministratore",
} as const;

export type NomeRuolo = (typeof RUOLI)[keyof typeof RUOLI];

export type CurrentUser = {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruoli: NomeRuolo[];
};

const selezioneUtente = {
  id: true,
  email: true,
  nome: true,
  cognome: true,
  attivo: true,
  ruoli: { select: { ruolo: { select: { nome: true } } } },
} as const;

type UtenteDb = {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruoli: { ruolo: { nome: string } }[];
};

function aCurrentUser(u: UtenteDb): CurrentUser {
  return {
    id: u.id,
    email: u.email,
    nome: u.nome,
    cognome: u.cognome,
    ruoli: u.ruoli.map((r) => r.ruolo.nome as NomeRuolo),
  };
}

/**
 * Utente che fa la richiesta, ricavato dall'header `Authorization: Bearer <token>`.
 * Il token è emesso da `login()` e firmato con AUTH_SECRET (vedi token.ts).
 * Token assente, manomesso o scaduto, oppure utente disattivato → 401.
 */
export async function getCurrentUser(request: Request): Promise<CurrentUser> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw unauthorized();

  const payload = verificaToken(token, config().AUTH_SECRET);
  if (!payload) throw unauthorized();

  const utente = await db.utente.findUnique({ where: { id: payload.sub }, select: selezioneUtente });
  if (!utente || !utente.attivo) throw unauthorized();
  impostaUtente(utente.id);
  return aCurrentUser(utente);
}

export function requireRole(user: CurrentUser, ...ammessi: NomeRuolo[]) {
  if (!user.ruoli.some((r) => ammessi.includes(r))) throw forbidden();
}

export function haRuolo(user: CurrentUser, ...ruoli: NomeRuolo[]) {
  return user.ruoli.some((r) => ruoli.includes(r));
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

// Hash di una password casuale: se l'email non esiste confrontiamo comunque
// con questo, così il tempo di risposta non rivela quali email sono registrate.
// Generato alla prima richiesta (stesso costo 10 degli hash veri del seed).
let hashFittizio: Promise<string> | undefined;
const HASH_FITTIZIO = () => (hashFittizio ??= bcrypt.hash(randomBytes(16).toString("hex"), 10));

// Limite ai tentativi falliti: max 5 ogni 15 minuti per email (in memoria del
// processo: con più repliche il limite vale per replica; per la produzione va
// spostato su un archivio condiviso o sull'Ingress).
const MAX_TENTATIVI = 5;
const FINESTRA_MS = 15 * 60 * 1000;
const tentativi = new Map<string, { n: number; dal: number }>();

function controllaTentativi(chiave: string, ora: number) {
  const t = tentativi.get(chiave);
  if (t && ora - t.dal < FINESTRA_MS && t.n >= MAX_TENTATIVI) {
    throw new AppError(429, "TOO_MANY_REQUESTS", "Troppi tentativi di accesso, riprovare più tardi");
  }
}

function registraFallimento(chiave: string, ora: number) {
  const t = tentativi.get(chiave);
  if (!t || ora - t.dal >= FINESTRA_MS) tentativi.set(chiave, { n: 1, dal: ora });
  else t.n++;
}

/** Solo per i test: azzera il contatore dei tentativi. */
export function azzeraTentativiLogin() {
  tentativi.clear();
}

/**
 * Verifica email e password e restituisce un token di accesso.
 * Email inesistente, password sbagliata e utente disattivato danno lo STESSO
 * errore 401: chi prova non scopre quali account esistono.
 */
export async function login(email: string, password: string) {
  const chiave = email.trim().toLowerCase();
  const ora = Date.now();
  controllaTentativi(chiave, ora);

  const utente = await db.utente.findFirst({
    where: { email: { equals: chiave, mode: "insensitive" } },
    select: { ...selezioneUtente, passwordHash: true },
  });
  const passwordOk = await bcrypt.compare(password, utente?.passwordHash ?? (await HASH_FITTIZIO()));

  if (!utente || !passwordOk || !utente.attivo) {
    registraFallimento(chiave, ora);
    // Niente email nel log (dato personale): basta sapere che c'è stato un fallimento.
    log.warn("login fallito", { evento: "LOGIN_FALLITO", tentativi: tentativi.get(chiave)?.n });
    throw new AppError(401, "INVALID_CREDENTIALS", "Email o password non corrette");
  }
  tentativi.delete(chiave);
  impostaUtente(utente.id);
  log.info("login riuscito", { evento: "LOGIN" });

  const { AUTH_SECRET, AUTH_TOKEN_TTL_MIN } = config();
  const durata = AUTH_TOKEN_TTL_MIN * 60;
  return {
    token: emettiToken(utente.id, AUTH_SECRET, durata),
    tokenType: "Bearer" as const,
    expiresIn: durata,
    utente: aCurrentUser(utente),
  };
}
