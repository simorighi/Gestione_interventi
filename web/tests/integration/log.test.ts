// Checklist sicurezza #6 (C5): i log dicono chi/cosa/quando senza password, token o email.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { PATCH as cambiaStato } from "@/app/api/segnalazioni/[id]/stato/route";
import { azzeraTentativiLogin } from "@/server/auth";
import { resetConfig } from "@/server/config";
import { chiama, PASSWORD_TEST, preparaDati } from "../helpers";

let d: Awaited<ReturnType<typeof preparaDati>>;
let righe: string[];

beforeEach(async () => {
  d = await preparaDati();
  azzeraTentativiLogin();
  process.env.LOG_LEVEL = "info";
  resetConfig();
  righe = [];
  const cattura = (chunk: string | Uint8Array) => {
    righe.push(String(chunk));
    return true;
  };
  vi.spyOn(process.stdout, "write").mockImplementation(cattura);
  vi.spyOn(process.stderr, "write").mockImplementation(cattura);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env.LOG_LEVEL = "error";
  resetConfig();
});

const json = () => righe.filter((r) => r.startsWith("{")).map((r) => JSON.parse(r));

describe("log strutturato", () => {
  it("login + cambio stato: righe JSON con userId, metodo, percorso, status; nessun segreto", async () => {
    const r = await chiama(login, "POST", "/api/auth/login", {
      body: { email: "responsabile@test.it", password: PASSWORD_TEST },
    });
    const s = await d.segnalazione("Luce rotta");
    await chiama(cambiaStato, "PATCH", `/api/segnalazioni/${s.id}/stato`, {
      utente: d.u.responsabile,
      params: { id: String(s.id) },
      body: { statoId: d.stati["Preso in carico"] },
    });

    const eventi = json();
    expect(eventi).toContainEqual(expect.objectContaining({ evento: "LOGIN", userId: d.u.responsabile }));
    expect(eventi).toContainEqual(
      expect.objectContaining({
        method: "PATCH",
        path: `/api/segnalazioni/${s.id}/stato`,
        status: 200,
        userId: d.u.responsabile,
        requestId: expect.any(String),
      }),
    );

    const tutto = righe.join("");
    expect(tutto).not.toContain(PASSWORD_TEST);
    expect(tutto).not.toContain(r.body.token);
    expect(tutto).not.toMatch(/@test\.it/);
  });

  it("login fallito: warn senza email", async () => {
    await chiama(login, "POST", "/api/auth/login", { body: { email: "admin@test.it", password: "sbagliata" } });
    expect(json()).toContainEqual(expect.objectContaining({ level: "warn", evento: "LOGIN_FALLITO" }));
    expect(righe.join("")).not.toContain("admin@test.it");
  });

  it("la risposta porta x-request-id, lo stesso della riga di log", async () => {
    const r = await chiama(login, "POST", "/api/auth/login", { body: { email: "x@test.it", password: "y" } });
    const id = r.headers.get("x-request-id");
    expect(id).toBeTruthy();
    expect(json().some((e) => e.requestId === id)).toBe(true);
  });
});
