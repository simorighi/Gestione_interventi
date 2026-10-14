import { connection } from "next/server";
import { db } from "@/server/db";

// Verifica che l'app risponda e che il database sia raggiungibile.
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "up" });
  } catch (err) {
    console.error(err);
    return Response.json({ status: "error", database: "down" }, { status: 503 });
  }
}
