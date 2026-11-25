import { z } from "zod";

// CONFIGURAZIONE ESTERNALIZZATA
// Tutte le variabili d'ambiente lette dall'app passano da qui: un solo punto
// dove sono elencate, validate e documentate (vedi docs/configuration.md).
// `loadConfig()` è chiamata all'avvio da src/instrumentation.ts: se manca una
// variabile obbligatoria il server non parte (fail-fast) invece di rompersi
// alla prima richiesta.

const listaOrigini = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url({ message: "CORS_ORIGIN deve contenere URL completi (es. http://localhost:5173)" })));

const schema = z.object({
  DATABASE_URL: z
    .string({ message: "Configurazione mancante: DATABASE_URL" })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL deve iniziare con postgresql://"),
  // Origini del frontend autorizzate a chiamare l'API da un altro dominio,
  // separate da virgola. Facoltativa: dietro l'Ingress (o il proxy di Vite)
  // frontend e API hanno la stessa origine e CORS non serve.
  CORS_ORIGIN: listaOrigini,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Config = z.infer<typeof schema>;

let cache: Config | undefined;

/** Legge e valida le variabili d'ambiente. Lancia un errore leggibile se non sono valide. */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const righe = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Configurazione non valida:\n${righe.join("\n")}`);
  }
  return parsed.data;
}

/** Configurazione corrente, validata una volta sola e poi riusata. */
export function config(): Config {
  cache ??= loadConfig();
  return cache;
}

/** Solo per i test: forza la rilettura di process.env. */
export function resetConfig() {
  cache = undefined;
}
