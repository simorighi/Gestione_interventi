import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, route } from "@/server/http";
import { archiveTransizione } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";

type Ctx = RouteContext<"/api/workflow/transizioni/[id]">;

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveTransizione(id, user));
});
