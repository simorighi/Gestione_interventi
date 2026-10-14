import "server-only";
import { db } from "./db";
import { forbidden, unauthorized } from "./errors";

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
  ruoli: NomeRuolo[];
};

/**
 * SEGNAPOSTO DI SVILUPPO — da sostituire con un'autenticazione vera
 * (sessione/JWT, es. Auth.js) prima di qualsiasi rilascio.
 *
 * Oggi l'utente corrente è identificato dall'header `x-user-id`, così le API
 * si possono provare con curl / REST client usando gli utenti del seed.
 */
export async function getCurrentUser(request: Request): Promise<CurrentUser> {
  const raw = request.headers.get("x-user-id");
  const id = Number(raw);
  if (!raw || !Number.isInteger(id)) throw unauthorized();

  const utente = await db.utente.findUnique({
    where: { id },
    select: { id: true, email: true, attivo: true, ruoli: { select: { ruolo: true } } },
  });
  if (!utente || !utente.attivo) throw unauthorized();

  return {
    id: utente.id,
    email: utente.email,
    ruoli: utente.ruoli.map((r) => r.ruolo.nome as NomeRuolo),
  };
}

export function requireRole(user: CurrentUser, ...ammessi: NomeRuolo[]) {
  if (!user.ruoli.some((r) => ammessi.includes(r))) throw forbidden();
}
