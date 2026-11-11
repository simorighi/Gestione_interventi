import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createAssegnazione, listAssegnazioni } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { assegnazioneInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/segnalazioni/[id]/assegnazioni">;

export const GET = route<Ctx>(async (request, ctx) => {
  await getCurrentUser(request);
  const { id } = idParam.parse(await ctx.params);
  return json(await listAssegnazioni(id));
});

export const POST = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await createAssegnazione(id, assegnazioneInputSchema.parse(await readJson(request)), user), { status: 201 });
});
