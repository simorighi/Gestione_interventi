import { describe, expect, it } from "vitest";
import { docsAttive, loadConfig } from "@/server/config";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
};

describe("loadConfig (fail-fast all'avvio)", () => {
  it("senza DATABASE_URL lancia un errore che nomina la variabile", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it("rifiuta una DATABASE_URL che non è PostgreSQL", () => {
    expect(() => loadConfig({ ...base, DATABASE_URL: "mysql://x" })).toThrow(/postgresql/);
  });

  it("senza AUTH_SECRET, o con un segreto troppo corto, non parte", () => {
    expect(() => loadConfig({ DATABASE_URL: base.DATABASE_URL })).toThrow(/AUTH_SECRET/);
    expect(() => loadConfig({ ...base, AUTH_SECRET: "corto" })).toThrow(/32 caratteri/);
  });

  it("CORS_ORIGIN è facoltativa e accetta più origini separate da virgola", () => {
    expect(loadConfig(base).CORS_ORIGIN).toEqual([]);
    expect(
      loadConfig({ ...base, CORS_ORIGIN: "http://localhost:5173, https://test.nordfacility.it" }).CORS_ORIGIN,
    ).toEqual(["http://localhost:5173", "https://test.nordfacility.it"]);
  });

  it("rifiuta una CORS_ORIGIN che non è un URL", () => {
    expect(() => loadConfig({ ...base, CORS_ORIGIN: "localhost" })).toThrow(/CORS_ORIGIN/);
  });

  it("LOG_LEVEL ha default info e accetta solo valori noti", () => {
    expect(loadConfig(base).LOG_LEVEL).toBe("info");
    expect(() => loadConfig({ ...base, LOG_LEVEL: "verbose" })).toThrow(/LOG_LEVEL/);
  });
});

describe("docsAttive (C7)", () => {
  it("attiva in sviluppo, spenta in produzione, forzabile con API_DOCS", () => {
    expect(docsAttive(loadConfig({ ...base, NODE_ENV: "development" }))).toBe(true);
    expect(docsAttive(loadConfig({ ...base, NODE_ENV: "production" }))).toBe(false);
    expect(docsAttive(loadConfig({ ...base, NODE_ENV: "production", API_DOCS: "true" }))).toBe(true);
    expect(docsAttive(loadConfig({ ...base, NODE_ENV: "development", API_DOCS: "false" }))).toBe(false);
  });
});
