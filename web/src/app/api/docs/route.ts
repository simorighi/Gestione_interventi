import { connection } from "next/server";
import { docsAttive } from "@/server/config";

// GET /api/docs — Swagger UI: documentazione interattiva per provare le API dal browser.
// Swagger UI è caricato da CDN con versione fissata E Subresource Integrity (C7):
// se il file servito dalla CDN cambiasse anche di un byte, il browser lo rifiuta.
// Per aggiornare la versione ricalcolare gli hash:
//   curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
// In produzione è spento, salvo API_DOCS=true (vedi src/server/config.ts).
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.29.5";
const SRI_CSS = "sha384-++DMKo1369T5pxDNqojF1F91bYxYiT1N7b1M15a7oCzEodfljztKlApQoH6eQSKI";
const SRI_JS = "sha384-+//OXWv2MI+XGzCNZ1tyxL1lT/whLV95IujjmbHXUgGh80zv+9B0ii6pDIO3URWN";

const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Smart Maintenance API</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${SRI_CSS}" crossorigin="anonymous" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${SRI_JS}" crossorigin="anonymous"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      persistAuthorization: true, // ricorda il token inserito in "Authorize"
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;

export async function GET() {
  // Valutato a ogni richiesta, non congelato al build (cacheComponents).
  await connection();
  if (!docsAttive()) return new Response("Not Found", { status: 404 });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
