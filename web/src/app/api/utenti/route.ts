import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createUtente, listUtenti } from "@/server/services/gestione.service";
import { utenteCreateSchema } from "@/server/validation/gestione";

export const GET = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  return json(await listUtenti());
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  return json(await createUtente(utenteCreateSchema.parse(await readJson(request)), user), { status: 201 });
});
