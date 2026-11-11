import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import {
  createTransizione,
  listTransizioni,
} from "@/server/services/gestione.service";
import { transizioneInputSchema } from "@/server/validation/gestione";

export const GET = route(async (request) => {
  await getCurrentUser(request);
  return json(await listTransizioni());
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  return json(await createTransizione(transizioneInputSchema.parse(await readJson(request)), user), { status: 201 });
});
