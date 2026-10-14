import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { cambiaStato } from "@/server/services/segnalazioni.service";
import { cambiaStatoSchema, idParam } from "@/server/validation/segnalazioni";

// PATCH /api/segnalazioni/:id/stato  { statoId, motivo? }
export const PATCH = route<RouteContext<"/api/segnalazioni/[id]/stato">>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.TECNICO, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);

  const { id } = idParam.parse(await ctx.params);
  const input = cambiaStatoSchema.parse(await readJson(request));
  return json(await cambiaStato(id, input, user));
});
