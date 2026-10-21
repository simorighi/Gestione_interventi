import { openApiSpec } from "@/server/openapi";

// GET /api/openapi.json — specifica OpenAPI (importabile anche in Postman / Insomnia)
export function GET() {
  return Response.json(openApiSpec);
}
