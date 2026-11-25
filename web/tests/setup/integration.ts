// Eseguito prima di ogni file di test di integrazione.
import { inject, vi } from "vitest";

// Il database temporaneo avviato da global-db.ts.
process.env.DATABASE_URL = inject("databaseUrl");
process.env.LOG_LEVEL = "error";

// `connection()` di Next.js funziona solo dentro una richiesta servita da Next:
// chiamando i route handler direttamente non serve, quindi diventa un no-op.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
