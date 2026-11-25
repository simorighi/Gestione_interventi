# Bug report — 43

| Progetto | Team / cliente | Data | Versione |
|---|---|---|---|
| Smart Maintenance | Team 1 / NordFacility S.r.l. | 25/11/2026 | v0.2 |

## Sintomo

Filtrando le segnalazioni "fino al 1 ottobre" (`GET /api/segnalazioni?al=2026-10-01`)
mancano quelle create **durante** il 1 ottobre. Con `dal=2026-10-01&al=2026-10-01`
la lista è sempre vuota, anche se quel giorno ci sono segnalazioni.

## Passi per riprodurre

1. Avere una segnalazione con `data_creazione = 2026-10-01 15:30 UTC`.
2. Chiamare `GET /api/segnalazioni?dal=2026-10-01&al=2026-10-01`.
3. Risultato: `{"items": [], "total": 0}`. Atteso: la segnalazione del 1 ottobre.

Riprodotto in automatico da `web/tests/integration/filtro-periodo.test.ts`.
Prima della correzione, 2 test su 3 fallivano (`Received: []`).

## Causa

In `web/src/server/validation/segnalazioni.ts` il parametro `al` era
`z.coerce.date()`. `new Date("2026-10-01")` è la **mezzanotte iniziale** del
1 ottobre, e il service usa `dataCreazione <= al`, quindi resta escluso tutto
il giorno indicato.

## Correzione

`al` ora passa da `fineperiodo`. Se il valore è solo una data (`AAAA-MM-GG`),
diventa le 23:59:59.999 UTC di quel giorno. Se contiene anche l'ora, il limite
resta esatto. Una data non valida dà ancora 400.

## Test aggiunto

| Test | Percorso | Verifica |
|---|---|---|
| `al=2026-10-01 include le segnalazioni create durante il 1 ottobre` | `web/tests/integration/filtro-periodo.test.ts` | il giorno indicato in `al` è incluso |
| `dal=…&al=… stesso giorno` | stesso file | un intervallo di un giorno restituisce quel giorno |
| `con data e ora esplicite il limite resta esatto` | stesso file | la correzione non cambia il caso con l'orario |

## Verifica di regressione

`cd web && npm test`, eseguito il 25/11/2026: 52 test su 52 passano, compresi i 3
nuovi. Togliendo `fineperiodo` (tornando a `z.coerce.date()`), i primi due
tornano a fallire.

## Da confermare col cliente

Il "giorno" è calcolato in UTC. Per un utente in Italia una segnalazione creata
alle 00:30 ora locale del 2 ottobre (22:30 UTC del 1 ottobre) rientra nel 1
ottobre. Va chiesto a NordFacility se il filtro debba seguire il fuso
Europe/Rome.
