import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { archiveNota, updateNota } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { notaInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/note/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateNota(id, notaInputSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.TECNICO, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await archiveNota(id, user));
});
