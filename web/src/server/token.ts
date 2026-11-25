import { createHmac, timingSafeEqual } from "node:crypto";

// TOKEN DI ACCESSO FIRMATI (HMAC-SHA256)
// Formato: <payload base64url>.<firma base64url>, payload = { sub, iat, exp }.
// La firma dimostra che il token l'ha emesso il nostro server (solo lui conosce
// AUTH_SECRET): il client non può cambiare `sub` per diventare un altro utente.
// Il token contiene solo l'id: ruoli e stato "attivo" si rileggono dal DB a
// ogni richiesta, così disattivare un utente ha effetto subito.

export type PayloadToken = { sub: number; iat: number; exp: number };

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function firma(dati: string, segreto: string) {
  return createHmac("sha256", segreto).update(dati).digest();
}

/** Emette un token per l'utente `sub`, valido `durataSec` secondi. */
export function emettiToken(sub: number, segreto: string, durataSec: number, ora = Date.now()): string {
  const iat = Math.floor(ora / 1000);
  const payload = b64(JSON.stringify({ sub, iat, exp: iat + durataSec } satisfies PayloadToken));
  return `${payload}.${b64(firma(payload, segreto))}`;
}

/** Verifica firma e scadenza. Restituisce il payload, oppure null se il token non è valido. */
export function verificaToken(token: string, segreto: string, ora = Date.now()): PayloadToken | null {
  const parti = token.split(".");
  if (parti.length !== 2) return null;
  const [payload, firmaRicevuta] = parti;

  const attesa = firma(payload, segreto);
  const ricevuta = Buffer.from(firmaRicevuta, "base64url");
  // Confronto a tempo costante: non rivela quanti byte della firma sono giusti.
  if (ricevuta.length !== attesa.length || !timingSafeEqual(ricevuta, attesa)) return null;

  let dati: unknown;
  try {
    dati = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof dati !== "object" || dati === null ||
    !Number.isInteger((dati as PayloadToken).sub) ||
    typeof (dati as PayloadToken).exp !== "number"
  ) {
    return null;
  }
  const p = dati as PayloadToken;
  if (p.exp <= Math.floor(ora / 1000)) return null;
  return p;
}
