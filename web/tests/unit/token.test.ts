import { describe, expect, it } from "vitest";
import { emettiToken, verificaToken } from "@/server/token";

const SEGRETO = "s".repeat(40);
const ORA = Date.UTC(2026, 10, 25, 10, 0, 0);

describe("token di accesso firmati", () => {
  it("un token appena emesso è valido e porta l'id utente", () => {
    const t = emettiToken(7, SEGRETO, 3600, ORA);
    expect(verificaToken(t, SEGRETO, ORA)?.sub).toBe(7);
  });

  it("scaduto → null", () => {
    const t = emettiToken(7, SEGRETO, 60, ORA);
    expect(verificaToken(t, SEGRETO, ORA + 61_000)).toBeNull();
  });

  it("firmato con un altro segreto → null", () => {
    const t = emettiToken(7, "a".repeat(40), 3600, ORA);
    expect(verificaToken(t, SEGRETO, ORA)).toBeNull();
  });

  it("payload modificato per impersonare l'utente 1 → null (la firma non torna più)", () => {
    const [, firma] = emettiToken(7, SEGRETO, 3600, ORA).split(".");
    const falso = Buffer.from(JSON.stringify({ sub: 1, iat: 0, exp: 9_999_999_999 })).toString("base64url");
    expect(verificaToken(`${falso}.${firma}`, SEGRETO, ORA)).toBeNull();
  });

  it.each(["", "abc", "a.b.c", "x.y", "7"])("formato non valido %j → null", (t) => {
    expect(verificaToken(t, SEGRETO, ORA)).toBeNull();
  });
});
