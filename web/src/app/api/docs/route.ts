// GET /api/docs — Swagger UI: documentazione interattiva per provare le API dal browser.
// Swagger UI è caricato da CDN (versione fissata); legge la specifica da /api/openapi.json.
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.29.5";

const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Smart Maintenance API</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      persistAuthorization: true, // ricorda l'x-user-id inserito in "Authorize"
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
