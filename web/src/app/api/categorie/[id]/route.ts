import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { archiveCategoria, updateCategoria } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { categoriaInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/categorie/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateCategoria(id, categoriaInputSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveCategoria(id, user));
});
