import { describe, expect, it } from "vitest";
import { loadConfig } from "@/server/config";

const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db" };

describe("loadConfig (fail-fast all'avvio)", () => {
  it("senza DATABASE_URL lancia un errore che nomina la variabile", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it("rifiuta una DATABASE_URL che non è PostgreSQL", () => {
    expect(() => loadConfig({ DATABASE_URL: "mysql://x" })).toThrow(/postgresql/);
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
