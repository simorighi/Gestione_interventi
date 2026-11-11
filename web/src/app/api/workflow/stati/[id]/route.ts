import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { archiveStato, updateStato } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { statoInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/workflow/stati/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateStato(id, statoInputSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveStato(id, user));
});
