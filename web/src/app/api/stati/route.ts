import { json, route } from "@/server/http";
import { listStati } from "@/server/services/anagrafiche.service";

export const GET = route(async () => json(await listStati()));
