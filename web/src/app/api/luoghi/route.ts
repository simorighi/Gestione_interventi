import { json, route } from "@/server/http";
import { listLuoghi } from "@/server/services/anagrafiche.service";

// GET /api/luoghi — tutti i luoghi (edifici, aree, impianti), prima gli edifici.
// Chi può chiamarla: chiunque. padreId indica il luogo che lo contiene (null = edificio).
// Risposta 200: [{ id, nome, tipo, via, citta, cap, padreId }, ...]
export const GET = route(async () => json(await listLuoghi()));
