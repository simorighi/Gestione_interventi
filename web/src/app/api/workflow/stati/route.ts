import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createStato, listStati } from "@/server/services/gestione.service";
import { statoInputSchema } from "@/server/validation/gestione";

export const GET = route(async (request) => {
  await getCurrentUser(request);
  return json(await listStati());
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  return json(await createStato(statoInputSchema.parse(await readJson(request)), user), { status: 201 });
});
