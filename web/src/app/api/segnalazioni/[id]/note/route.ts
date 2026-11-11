import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createNota, listNote } from "@/server/services/gestione.service";
import { idParam } from "@/server/validation/segnalazioni";
import { notaInputSchema } from "@/server/validation/gestione";

type Ctx = RouteContext<"/api/segnalazioni/[id]/note">;

export const GET = route<Ctx>(async (request, ctx) => {
  await getCurrentUser(request);
  const { id } = idParam.parse(await ctx.params);
  return json(await listNote(id));
});

export const POST = route<Ctx>(async (request, ctx) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.TECNICO, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  const { id } = idParam.parse(await ctx.params);
  return json(await createNota(id, notaInputSchema.parse(await readJson(request)), user), { status: 201 });
});
