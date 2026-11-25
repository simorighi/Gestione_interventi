// MACCHINA A STATI DELLE SEGNALAZIONI (dal backlog, voce 4).
// Modulo puro, senza database: così le regole si testano con test unitari.
// I nomi devono coincidere esattamente con la colonna `nome` della tabella `stato`.

/** Nome dello stato in cui nasce ogni segnalazione. */
export const STATO_INIZIALE = "Segnalato";

/** Per ogni stato, gli stati in cui si può passare. Per cambiare il workflow basta modificare questa mappa. */
export const TRANSIZIONI: Readonly<Record<string, readonly string[]>> = {
  Segnalato: ["Preso in carico"],
  "Preso in carico": ["In lavorazione"],
  "In lavorazione": ["Sospeso", "Risolto"],
  Sospeso: ["In lavorazione"],
  Risolto: [], // stato finale: da qui non si esce
};

/** Dato il nome di uno stato, restituisce i nomi degli stati raggiungibili da lì. */
export function transizioniAmmesse(nomeStato: string): readonly string[] {
  return TRANSIZIONI[nomeStato] ?? [];
}

/** true se il passaggio `da` → `a` è consentito dal workflow. */
export function transizioneAmmessa(da: string, a: string): boolean {
  return transizioniAmmesse(da).includes(a);
}
