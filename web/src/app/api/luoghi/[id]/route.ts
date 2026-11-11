import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { archiveLuogo, updateLuogo } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { luogoInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/luoghi/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateLuogo(id, luogoInputSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveLuogo(id, user));
});
