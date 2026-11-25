import { describe, expect, it } from "vitest";
import { STATO_INIZIALE, TRANSIZIONI, transizioneAmmessa, transizioniAmmesse } from "@/server/workflow";

describe("macchina a stati delle segnalazioni", () => {
  it("una segnalazione nasce in 'Segnalato'", () => {
    expect(STATO_INIZIALE).toBe("Segnalato");
  });

  it.each([
    ["Segnalato", "Preso in carico"],
    ["Preso in carico", "In lavorazione"],
    ["In lavorazione", "Sospeso"],
    ["In lavorazione", "Risolto"],
    ["Sospeso", "In lavorazione"],
  ])("ammette %s → %s", (da, a) => {
    expect(transizioneAmmessa(da, a)).toBe(true);
  });

  it.each([
    ["Segnalato", "Risolto"], // test-plan #2: non si salta uno stato
    ["Segnalato", "In lavorazione"],
    ["Preso in carico", "Risolto"],
    ["Sospeso", "Risolto"],
    ["Risolto", "In lavorazione"], // stato finale
    ["Segnalato", "Segnalato"],
  ])("rifiuta %s → %s", (da, a) => {
    expect(transizioneAmmessa(da, a)).toBe(false);
  });

  it("uno stato sconosciuto non ha transizioni (non lancia)", () => {
    expect(transizioniAmmesse("Inesistente")).toEqual([]);
  });

  it("ogni stato di destinazione è anche una chiave della mappa (niente stati 'orfani')", () => {
    for (const destinazioni of Object.values(TRANSIZIONI)) {
      for (const d of destinazioni) expect(Object.keys(TRANSIZIONI)).toContain(d);
    }
  });
});
