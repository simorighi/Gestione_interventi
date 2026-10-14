import { getCurrentUser, requireRole, RUOLI } from "@/server/auth";
import { json, readJson, route, searchParams } from "@/server/http";
import { creaSegnalazione, listSegnalazioni } from "@/server/services/segnalazioni.service";
import {
  creaSegnalazioneSchema,
  filtriSegnalazioniSchema,
} from "@/server/validation/segnalazioni";

// GET /api/segnalazioni?statoId=&categoriaId=&luogoId=&tecnicoId=&dal=&al=&q=&page=&pageSize=
export const GET = route(async (request) => {
  const filtri = filtriSegnalazioniSchema.parse(searchParams(request));
  return json(await listSegnalazioni(filtri));
});

// POST /api/segnalazioni  { titolo, descrizione, luogoId, categoriaId, prioritaPropostaId? }
export const POST = route(async (request) => {
  const user = await getCurrentUser(request);
  requireRole(user, RUOLI.SEGNALATORE, RUOLI.RESPONSABILE, RUOLI.AMMINISTRATORE);

  const input = creaSegnalazioneSchema.parse(await readJson(request));
  return json(await creaSegnalazione(input, user), { status: 201 });
});
