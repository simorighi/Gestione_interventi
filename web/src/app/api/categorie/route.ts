import { json, route } from "@/server/http";
import { listCategorie } from "@/server/services/anagrafiche.service";

export const GET = route(async () => json(await listCategorie()));
