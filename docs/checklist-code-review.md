# Checklist di code review — PR #12 Fix visibilità interventi[cite: 30]

| Progetto | Team revisionato | Team revisore | Data | Pull request |[cite: 30]
|---|---|---|---|---|
| Smart Maintenance | Simo Righi | Manuel Boscaini | 11/11/2026 | PR #12 |

## Correttezza[cite: 30]

- [x] Sì — *riferimento:* il filtro Prisma copre correttamente il caso di isolamento dei dati del tecnico loggato, rispettando la riga 3 di `docs/test-plan.md` ("solo il tecnico assegnato modifica/vede").[cite: 30]

## Leggibilità[cite: 30]

- [x] Sì — *riferimento:* l'estrazione dell'`id` dal token utente nelle route di Next.js e il suo passaggio a Prisma è chiaro in 3 righe, senza bisogno di ulteriori funzioni di appoggio.[cite: 30]

## Test[cite: 30]

- [x] Sì — *riferimento:* è presente il test `test_lista_filtrata_per_tecnico` in `tests/integration/api_interventi.test.ts`.[cite: 30] Fallisce rimuovendo il `where` da Prisma e passa con la correzione.[cite: 30]

## Impatto[cite: 30]

- [x] Sì (l'impatto è stato verificato) — *riferimento:* verificato che l'aggiunta di questo filtro non rompe la vista globale dell'amministratore (responsabile NordFacility), gestita in un blocco di codice o endpoint separato. La suite globale passa al 100%.[cite: 30]

## Esito[cite: 30]

- [x] Approvata così com'è[cite: 30]
- [ ] Approvata con commenti minori (non bloccanti)[cite: 30]
- [ ] Richieste modifiche — non si può chiudere senza rivederla[cite: 30]

## Commenti[cite: 30]

Ottimo lavoro. La correzione è isolata perfettamente e non impatta le viste amministrative. Nessun problema rilevato.
