import { json, route } from "@/server/http";
import { getSegnalazione, transizioniAmmesse } from "@/server/services/segnalazioni.service";
import { idParam } from "@/server/validation/segnalazioni";

// GET /api/segnalazioni/:id — dettaglio con storico, assegnazioni, note, allegati
export const GET = route<RouteContext<"/api/segnalazioni/[id]">>(async (_request, ctx) => {
  const { id } = idParam.parse(await ctx.params);
  const segnalazione = await getSegnalazione(id);
  return json({
    ...segnalazione,
    transizioniAmmesse: transizioniAmmesse(segnalazione.stato.nome),
  });
});
