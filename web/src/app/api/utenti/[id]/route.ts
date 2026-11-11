import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { updateUtente } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { utenteUpdateSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/utenti/[id]">;

export const PATCH = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateUtente(id, utenteUpdateSchema.parse(await readJson(request)), user));
});

export const DELETE = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await updateUtente(id, { attivo: false }, user));
});
