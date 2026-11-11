import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { listCategorie } from "@/server/services/anagrafiche.service";
import { createCategoria, listCategorie as listAllCategories } from "@/server/services/gestione.service";
import { categoriaInputSchema } from "@/server/validation/gestione";

// GET /api/categorie — elenco delle categorie attive, in ordine alfabetico.
// Chi può chiamarla: chiunque. Serve per il menu "categoria" quando si crea una segnalazione.
// Risposta 200: [{ id, nome, descrizione, attiva }, ...]
export const GET = route(async (request) => {
  const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
  if (!includeInactive) return json(await listCategorie());
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await listAllCategories(true));
});

export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);
  return json(await createCategoria(categoriaInputSchema.parse(await readJson(request)), user), { status: 201 });
});
