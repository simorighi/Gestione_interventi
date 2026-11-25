import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "./server/config";

// Eseguito prima di ogni richiesta /api/* (vedi `config.matcher` in fondo).
// 1. CORS: letto da CORS_ORIGIN a runtime, non congelato al build.
// 2. Header di sicurezza uguali per tutte le risposte dell'API.

const METODI = "GET, POST, PATCH, DELETE, OPTIONS";
const HEADER_AMMESSI = "Authorization, Content-Type";

const SICUREZZA: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  // Le risposte dell'API contengono dati personali: mai in cache condivise.
  "Cache-Control": "no-store",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const ammessa = origin !== null && appConfig().CORS_ORIGIN.includes(origin);

  const cors: Record<string, string> = ammessa
    ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
    : {};

  // Preflight del browser: rispondiamo qui senza arrivare alle route.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: ammessa ? 204 : 403,
      headers: ammessa
        ? {
            ...cors,
            "Access-Control-Allow-Methods": METODI,
            "Access-Control-Allow-Headers": HEADER_AMMESSI,
            "Access-Control-Max-Age": "600",
          }
        : {},
    });
  }

  const response = NextResponse.next();
  for (const [k, v] of Object.entries({ ...SICUREZZA, ...cors })) response.headers.set(k, v);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
