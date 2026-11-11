import "server-only";
import { db } from "./db";
import { AppError, forbidden, unauthorized } from "./errors";

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

export async function getCurrentUser(request: Request): Promise<CurrentUser> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw unauthorized();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AppError(503, "AUTH_NOT_CONFIGURED", "Autenticazione Supabase non configurata");
  }

  let authResponse: Response;
  try {
    authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new AppError(503, "AUTH_PROVIDER_UNAVAILABLE", "Servizio di autenticazione non raggiungibile");
  }
  if (!authResponse.ok) throw unauthorized();

  const authUser: unknown = await authResponse.json();
  if (
    typeof authUser !== "object" ||
    authUser === null ||
    !("email" in authUser) ||
    typeof authUser.email !== "string"
  ) {
    throw unauthorized();
  }

  const utente = await db.utente.findFirst({
    where: { email: { equals: authUser.email, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      nome: true,
      cognome: true,
      attivo: true,
      ruoli: { select: { ruolo: true } },
    },
  });
  if (!utente || !utente.attivo) throw unauthorized();

  return {
    id: utente.id,
    email: utente.email,
    nome: utente.nome,
    cognome: utente.cognome,
    ruoli: utente.ruoli.map((r) => r.ruolo.nome as NomeRuolo),
  };
}

export function requireRole(user: CurrentUser, ...ammessi: NomeRuolo[]) {
  if (!user.ruoli.some((r) => ammessi.includes(r))) throw forbidden();
}
