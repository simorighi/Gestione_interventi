import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { listLuoghi } from "@/server/services/anagrafiche.service";
import { createLuogo, listLuoghi as listAllPlaces } from "@/server/services/gestione.service";
import { luogoInputSchema } from "@/server/validation/gestione";

// GET /api/luoghi — tutti i luoghi (edifici, aree, impianti), prima gli edifici.
// Chi può chiamarla: chiunque. padreId indica il luogo che lo contiene (null = edificio).
// Risposta 200: [{ id, nome, tipo, via, citta, cap, padreId }, ...]
export const GET = route(async (request) => {
  const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
  if (!includeArchived) return json(await listLuoghi());
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await listAllPlaces(true));
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await createLuogo(luogoInputSchema.parse(await readJson(request)), user), { status: 201 });
});
