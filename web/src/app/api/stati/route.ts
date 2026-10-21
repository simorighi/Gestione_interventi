import { json, route } from "@/server/http";
import { listStati } from "@/server/services/anagrafiche.service";

// GET /api/stati — gli stati del workflow nell'ordine in cui si attraversano.
// Chi può chiamarla: chiunque. L'id serve come statoId nei filtri e nel cambio di stato.
// Risposta 200: [{ id, nome, ordine, isFinale }, ...]
export const GET = route(async () => json(await listStati()));
