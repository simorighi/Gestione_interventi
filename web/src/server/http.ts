import "server-only";
import { connection } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./errors";

type Handler<Ctx> = (request: Request, ctx: Ctx) => Promise<Response>;

/**
 * Avvolge un route handler e traduce ogni errore in una risposta JSON uniforme:
 * { error: { code, message, details? } }
 *
 * `connection()` forza l'esecuzione a ogni richiesta: con cacheComponents attivo
 * un GET che non legge la request potrebbe altrimenti essere prerenderizzato al build.
 */
export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, ctx) => {
    // Fuori dal try: il segnale di interruzione del prerender non va intercettato.
    await connection();
    try {
      return await handler(request, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

function toErrorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return errorJson(err.status, err.code, err.message, err.details);
  }
  if (err instanceof ZodError) {
    return errorJson(400, "VALIDATION_ERROR", "Dati non validi", err.issues);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return errorJson(409, "CONFLICT", "Valore già esistente", err.meta);
      case "P2003":
        return errorJson(400, "INVALID_REFERENCE", "Riferimento a un record inesistente", err.meta);
      case "P2025":
        return errorJson(404, "NOT_FOUND", "Record non trovato");
    }
  }
  console.error(err);
  return errorJson(500, "INTERNAL_ERROR", "Errore interno del server");
}

function errorJson(status: number, code: string, message: string, details?: unknown) {
  return Response.json({ error: { code, message, details } }, { status });
}

/**
 * Come Response.json ma gestisce i BigInt (es. allegato.dimensione),
 * che JSON.stringify non sa serializzare.
 */
export function json(data: unknown, init?: ResponseInit): Response {
  const body = JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v));
  return new Response(body, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
}

/** Legge e valida il body JSON; un body malformato diventa un 400, non un 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "BAD_REQUEST", "Body JSON non valido");
  }
}

/** Converte i query params in oggetto, pronto per essere validato con zod. */
export function searchParams(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}
