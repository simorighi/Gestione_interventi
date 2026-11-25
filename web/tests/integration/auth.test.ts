// Checklist sicurezza #1 (C1): chiamare un endpoint protetto senza un token valido dà 401.
import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as crea } from "@/app/api/segnalazioni/route";
import { azzeraTentativiLogin } from "@/server/auth";
import { emettiToken } from "@/server/token";
import { chiama, PASSWORD_TEST, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;

beforeEach(async () => {
  d = await preparaDati();
  azzeraTentativiLogin();
});

const accedi = (email: string, password: string) =>
  chiama(login, "POST", "/api/auth/login", { body: { email, password } });

describe("POST /api/auth/login", () => {
  it("credenziali corrette: token utilizzabile su /api/auth/me", async () => {
    const r = await accedi("Tecnico.A@test.it", PASSWORD_TEST); // email senza distinzione maiuscole
    expect(r.status).toBe(200);
    expect(r.body.utente).toMatchObject({ id: d.u.tecnicoA, ruoli: ["Tecnico"] });
    expect(r.body.utente).not.toHaveProperty("passwordHash");

    const io = await chiama(me, "GET", "/api/auth/me", { headers: { authorization: `Bearer ${r.body.token}` } });
    expect(io.status).toBe(200);
    expect(io.body.id).toBe(d.u.tecnicoA);
  });

  it("password sbagliata ed email inesistente danno lo stesso 401", async () => {
    const sbagliata = await accedi("tecnico.a@test.it", "non-questa");
    const inesistente = await accedi("nessuno@test.it", PASSWORD_TEST);
    expect(sbagliata.status).toBe(401);
    expect(inesistente.status).toBe(401);
    expect(sbagliata.body).toEqual(inesistente.body);
  });

  it("utente disattivato non entra", async () => {
    expect((await accedi("ex@test.it", PASSWORD_TEST)).status).toBe(401);
  });

  it("dopo 5 tentativi falliti risponde 429, anche con la password giusta", async () => {
    for (let i = 0; i < 5; i++) await accedi("admin@test.it", "sbagliata");
    expect((await accedi("admin@test.it", PASSWORD_TEST)).status).toBe(429);
  });

  it("body non valido: 400", async () => {
    expect((await chiama(login, "POST", "/api/auth/login", { body: { email: "non-email" } })).status).toBe(400);
  });
});

describe("endpoint protetti", () => {
  const vuoto = { titolo: "x", descrizione: "y", luogoId: 1, categoriaId: 1, prioritaPropostaId: 1 };

  it("il vecchio header x-user-id non autentica più nessuno", async () => {
    const r = await chiama(crea, "POST", "/api/segnalazioni", { headers: { "x-user-id": String(d.u.admin) }, body: vuoto });
    expect(r.status).toBe(401);
  });

  it.each([
    ["token manomesso", () => `Bearer ${emettiToken(d.u.admin, "altro-segreto-lungo-almeno-32-caratteri!", 3600)}`],
    ["token scaduto", () => `Bearer ${emettiToken(d.u.admin, process.env.AUTH_SECRET!, 60, Date.now() - 120_000)}`],
    ["schema diverso da Bearer", () => `Basic YWRtaW46cGFzc3dvcmQ=`],
  ])("%s: 401", async (_n, header) => {
    const r = await chiama(me, "GET", "/api/auth/me", { headers: { authorization: header() } });
    expect(r.status).toBe(401);
  });
});
