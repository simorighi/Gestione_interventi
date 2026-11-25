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

function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Client Prisma creato alla PRIMA query, non quando il modulo viene importato:
 * `next build` importa le route per analizzarle e non ha (né deve avere)
 * DATABASE_URL. A runtime la configurazione è già stata validata all'avvio
 * (src/instrumentation.ts).
 */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
