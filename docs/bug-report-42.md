# Bug report — 42

| Progetto | Team / cliente | Data | Versione | Autore |
|---|---|---|---|---|
| Smart Maintenance | Simo, Nat, Nicola, Rzamp, Manuel / NordFacility S.r.l. | 11/11/2026 (aperto) · 25/11/2026 (corretto) | v0.2 | Manuel Boscaini (segnalazione) |

> **Nota sulla versione precedente (v0.1).** La prima stesura descriveva file
> che nel repository non esistevano: `app/api/interventi/route.ts`,
> `prisma.intervento.findMany()`, `tests/integration/api_interventi.test.ts`.
> Dichiarava anche "suite completa eseguita, tutti i test passano", ma il
> repository non conteneva nessun test. Il sintomo invece era reale. Questa
> versione lo riproduce sul codice vero.

## Sintomo

Il tecnico B vede nella sua lista anche l'intervento assegnato al tecnico A.
Più in generale `GET /api/segnalazioni` restituiva **tutte** le segnalazioni,
con nome, cognome ed email delle persone coinvolte, a chiunque la chiamasse,
anche senza autenticazione.

## Passi per riprodurre

1. Segnalazione "Intervento 42" assegnata al tecnico A; un'altra assegnata al tecnico B.
2. Il tecnico B chiama `GET /api/segnalazioni`.
3. Risultato: entrambe le segnalazioni (`total: 2`). Atteso: solo la sua (`total: 1`).
4. Il tecnico B chiama `GET /api/segnalazioni/<id della 42>`: riceve il dettaglio completo. Atteso: 404.

Riprodotto da `web/tests/integration/visibilita.test.ts`: prima della
correzione **12 test su 12 fallivano**.

## Causa

`listSegnalazioni(f)` in `web/src/server/services/segnalazioni.service.ts`
costruiva la `where` solo con i filtri della query string. Nessuna condizione
dipendeva da chi faceva la richiesta, e la route `GET /api/segnalazioni` non
chiamava nemmeno `getCurrentUser`. Lo stesso valeva per `getSegnalazione(id)`,
che usava `findUnique({ where: { id } })`. Il filtro `tecnicoId` era solo un
filtro facoltativo, non un vincolo.

## Correzione

- Nuova funzione `filtroVisibilita(user)` nel service. Responsabile e
  Amministratore non hanno filtro; il Tecnico ha
  `assegnazioni: { some: { tecnicoId: user.id } }`; il Segnalatore ha
  `segnalatoreId: user.id`. Con più ruoli vale l'unione.
- `listSegnalazioni` combina i filtri dell'utente con la visibilità in `AND`,
  così `?tecnicoId=A` non allarga ciò che B può vedere. `getSegnalazione` usa
  `findFirst` con la stessa condizione: fuori perimetro risponde 404.
- Tutte le letture, anagrafiche comprese, richiedono il token.
- `utentePubblico` non include più l'email.

Commit: `Protegge letture, filtra per ruolo`.

## Test aggiunto

| Test | Percorso | Verifica |
|---|---|---|
| `bug 42: il tecnico B NON vede l'intervento 42 assegnato al tecnico A` | `web/tests/integration/visibilita.test.ts` | lista filtrata per tecnico |
| `il filtro tecnicoId non scavalca la visibilità` | stesso file | il filtro non allarga il perimetro |
| `una segnalazione non di competenza risponde 404` | stesso file | anche il dettaglio è protetto |
| `responsabile e amministratore vedono tutto` | stesso file | la vista globale del responsabile non si rompe |
| `le risposte non contengono le email degli altri utenti` | stesso file | dati personali |

## Verifica di regressione

`cd web && npm test`, eseguito il 25/11/2026: 108 test su 108 passano. Togliendo
`filtroVisibilita` da `listSegnalazioni`, il test `bug 42` torna a fallire con
`total: 2`.
