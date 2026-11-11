import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { archiveTecnico, updateTecnico } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { utenteUpdateSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/tecnici/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  const input = utenteUpdateSchema.parse(await readJson(request));
  return json(await updateTecnico(id, input, user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveTecnico(id, user));
});
