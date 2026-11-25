import { connection } from "next/server";
import { docsAttive } from "@/server/config";
import { openApiSpec } from "@/server/openapi";

// GET /api/openapi.json — specifica OpenAPI (importabile anche in Postman / Insomnia).
// Spenta in produzione come /api/docs, salvo API_DOCS=true.
export async function GET() {
  // Valutato a ogni richiesta, non congelato al build (cacheComponents).
  await connection();
  if (!docsAttive()) return Response.json({ error: { code: "NOT_FOUND", message: "Non trovato" } }, { status: 404 });
  return Response.json(openApiSpec);
}
