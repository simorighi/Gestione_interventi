import { describe, expect, it } from "vitest";
import {
  cambiaStatoSchema,
  creaSegnalazioneSchema,
  filtriSegnalazioniSchema,
  idParam,
} from "@/server/validation/segnalazioni";

const valida = {
  titolo: "Luce rotta",
  descrizione: "La plafoniera della sala A non si accende.",
  luogoId: 1,
  categoriaId: 2,
  prioritaPropostaId: 3,
};

describe("creaSegnalazioneSchema", () => {
  it("accetta un body completo e converte gli id da stringa", () => {
    expect(creaSegnalazioneSchema.parse({ ...valida, luogoId: "1" }).luogoId).toBe(1);
  });

  it("toglie gli spazi ai bordi del titolo", () => {
    expect(creaSegnalazioneSchema.parse({ ...valida, titolo: "  Luce rotta  " }).titolo).toBe("Luce rotta");
  });

  it.each([
    ["titolo troppo corto", { titolo: "ab" }],
    ["titolo di soli spazi", { titolo: "     " }],
    ["descrizione troppo corta", { descrizione: "corta" }],
    ["id non numerico", { luogoId: "abc" }],
    ["id negativo", { categoriaId: -1 }],
    ["id decimale", { prioritaPropostaId: 1.5 }],
  ])("rifiuta: %s", (_nome, modifica) => {
    expect(creaSegnalazioneSchema.safeParse({ ...valida, ...modifica }).success).toBe(false);
  });

  it("rifiuta un campo obbligatorio mancante", () => {
    const senzaTitolo: Partial<typeof valida> = { ...valida };
    delete senzaTitolo.titolo;
    expect(creaSegnalazioneSchema.safeParse(senzaTitolo).success).toBe(false);
  });
});

describe("cambiaStatoSchema", () => {
  it("motivo facoltativo", () => {
    expect(cambiaStatoSchema.parse({ statoId: 2 })).toEqual({ statoId: 2 });
  });
  it("rifiuta un motivo oltre 1000 caratteri", () => {
    expect(cambiaStatoSchema.safeParse({ statoId: 2, motivo: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("filtriSegnalazioniSchema", () => {
  it("applica i default di paginazione", () => {
    expect(filtriSegnalazioniSchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
  });
  it("limita pageSize a 100", () => {
    expect(filtriSegnalazioniSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
  it("rifiuta una data non valida", () => {
    expect(filtriSegnalazioniSchema.safeParse({ dal: "ieri" }).success).toBe(false);
  });
});

describe("idParam", () => {
  it.each(["0", "-3", "abc", "1.2"])("rifiuta id %s", (id) => {
    expect(idParam.safeParse({ id }).success).toBe(false);
  });
});
