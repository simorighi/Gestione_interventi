import { connection } from "next/server";
import { db } from "@/server/db";
import { descriviErrore, log } from "@/server/log";

// Verifica che l'app risponda e che il database sia raggiungibile.
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "up" });
  } catch (err) {
    log.error("health check: database non raggiungibile", descriviErrore(err));
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}
