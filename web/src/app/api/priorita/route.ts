import { json, route } from "@/server/http";
import { listPriorita } from "@/server/services/anagrafiche.service";

export const GET = route(async () => json(await listPriorita()));
