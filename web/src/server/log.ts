import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "./config";

// LOG STRUTTURATO (criticità C5)
// Una riga JSON per evento su stdout/stderr: Kubernetes la raccoglie
// (`kubectl logs`) e la si filtra per campo (requestId, userId, status...).
// Regole: niente password, token, header o body delle richieste, niente email.
// Si registra CHI (userId), COSA (method + path, evento), QUANDO (ts) e l'ESITO.

const LIVELLI = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Livello = keyof typeof LIVELLI;

/** Contesto della richiesta in corso, riempito da route() e da getCurrentUser(). */
type ContestoRichiesta = { requestId: string; userId?: number };
const contesto = new AsyncLocalStorage<ContestoRichiesta>();

export function conContesto<T>(ctx: ContestoRichiesta, fn: () => T): T {
  return contesto.run(ctx, fn);
}

/** Chiamata dopo l'autenticazione: le righe di log successive riportano l'utente. */
export function impostaUtente(userId: number) {
  const ctx = contesto.getStore();
  if (ctx) ctx.userId = userId;
}

function scrivi(livello: Livello, msg: string, campi: Record<string, unknown> = {}) {
  let minimo: Livello = "info";
  try {
    minimo = config().LOG_LEVEL;
  } catch {
    // configurazione non valida: si logga comunque a livello info
  }
  if (LIVELLI[livello] < LIVELLI[minimo]) return;

  const riga = JSON.stringify({
    ts: new Date().toISOString(),
    level: livello,
    msg,
    ...contesto.getStore(),
    ...campi,
  });
  if (LIVELLI[livello] >= LIVELLI.warn) process.stderr.write(riga + "\n");
  else process.stdout.write(riga + "\n");
}

export const log = {
  debug: (msg: string, campi?: Record<string, unknown>) => scrivi("debug", msg, campi),
  info: (msg: string, campi?: Record<string, unknown>) => scrivi("info", msg, campi),
  warn: (msg: string, campi?: Record<string, unknown>) => scrivi("warn", msg, campi),
  error: (msg: string, campi?: Record<string, unknown>) => scrivi("error", msg, campi),
};

/** Descrizione di un errore senza dati della richiesta: nome, messaggio, codice e stack. */
export function descriviErrore(err: unknown) {
  if (err instanceof Error) {
    return {
      errore: err.name,
      messaggio: err.message,
      codice: (err as { code?: unknown }).code,
      stack: err.stack?.split("\n").slice(0, 6).join("\n"),
    };
  }
  return { errore: String(err) };
}
