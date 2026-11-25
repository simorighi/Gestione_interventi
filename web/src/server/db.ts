import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { config } from "./config";

// Singleton: in sviluppo l'hot reload di Next.js ricarica i moduli e,
// senza questa cache su globalThis, aprirebbe un nuovo pool a ogni modifica.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const { DATABASE_URL, LOG_LEVEL } = config();
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    log: LOG_LEVEL === "debug" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
