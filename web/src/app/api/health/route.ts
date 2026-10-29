import { connection } from "next/server";
import { db } from "@/server/db";

// Verifica che l'app risponda e che il database sia raggiungibile.
export async function GET() {
  await connection();
  const startedAt = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    if (process.env.NODE_ENV === "development") {
      console.debug("[api/health] database raggiungibile", {
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
    return Response.json({ status: "ok", database: "up" });
  } catch (err) {
    console.error("[api/health] database non raggiungibile", {
      durationMs: Math.round(performance.now() - startedAt),
      errorName: err instanceof Error ? err.name : "UnknownError",
      ...(typeof err === "object" && err !== null && "code" in err
        ? { errorCode: String(err.code) }
        : {}),
    });
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}
