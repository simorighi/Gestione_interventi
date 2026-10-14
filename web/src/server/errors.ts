/** Errore applicativo con status HTTP: i service lanciano questi, le route li traducono. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new AppError(404, "NOT_FOUND", message);

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const unauthorized = () =>
  new AppError(401, "UNAUTHORIZED", "Autenticazione richiesta");

export const forbidden = () =>
  new AppError(403, "FORBIDDEN", "Operazione non consentita per il ruolo corrente");

export const conflict = (message: string) => new AppError(409, "CONFLICT", message);
