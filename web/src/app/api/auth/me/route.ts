import { getCurrentUser } from "@/server/auth";
import { json, route } from "@/server/http";

export const GET = route(async (request) => json(await getCurrentUser(request)));
