import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createUtente, listTecnici } from "@/server/services/gestione.service";
import { utenteCreateSchema } from "@/server/validation/gestione";

export const GET = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.TECNICO, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await listTecnici());
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const input = utenteCreateSchema.parse(await readJson(request));
  if (input.ruolo !== RUOLI.TECNICO) {
    return Response.json({ error: { code: "BAD_REQUEST", message: "Il ruolo deve essere Tecnico" } }, { status: 400 });
  }
  return json(await createUtente(input, user), { status: 201 });
});
