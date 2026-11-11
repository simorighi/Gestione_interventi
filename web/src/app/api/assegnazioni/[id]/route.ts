import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, route } from "@/server/http";
import { archiveAssegnazione } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";

type Ctx = RouteContext<"/api/assegnazioni/[id]">;

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveAssegnazione(id, user));
});
