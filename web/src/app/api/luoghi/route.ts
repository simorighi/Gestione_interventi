import { json, route } from "@/server/http";
import { listLuoghi } from "@/server/services/anagrafiche.service";

export const GET = route(async () => json(await listLuoghi()));
