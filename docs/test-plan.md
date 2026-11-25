# Test plan — Smart Maintenance

| Progetto | Team / cliente | Data | Versione |
|---|---|---|---|
| Smart Maintenance | Team 1 (Simo, Nat, Nicola, Rzamp, Manu) / NordFacility S.r.l. | 25/11/2026 | v0.2 |

Una riga per ogni caso di test che decide qualcosa: logica di business, casi
limite, ciò che si è già rotto una volta. Gli esiti sono quelli di
un'esecuzione reale della suite (`cd web && npm test`), non previsioni.

## Caso d'uso

> "Il tecnico aggiorna lo stato di un intervento assegnato; il segnalatore vede il nuovo stato."

## Come si eseguono

```bash
cd web
npm test                    # 108 test: unit + integration
npm run test:unit           # solo logica pura (workflow, validazione, token, config)
npm run test:integration    # route → service → Prisma → PostgreSQL 17 vero
```

I test di integrazione chiamano i route handler di Next.js con una `Request`
vera e scrivono su un PostgreSQL temporaneo avviato dalla suite
(`tests/setup/global-db.ts`, pacchetto `embedded-postgres`). Non serve Docker e
il database Supabase del team non viene mai toccato. Ogni test riparte da dati
noti (`preparaDati()` in `tests/helpers.ts`).

## Matrice requisito → caso di test → esito

| # | Requisito / vincolo | Caso di test | Input / precondizioni | Risultato atteso | Tipo | Test | Esito |
|---|---|---|---|---|---|---|---|
| 1 | transizione di stato valida | happy path | Responsabile, `Segnalato → Preso in carico` | 200, nuovo stato salvato, riga in `storico_stato` e in `log_audit` con l'utente | integration | `segnalazioni.test.ts` › `#1 transizione valida` | passa (25/11) |
| 2 | non si salta uno stato | transizione non valida | `Segnalato → Risolto` | 400 con `ammessi: ["Preso in carico"]`, stato invariato nel DB | unit + integration | `workflow.test.ts` › `rifiuta Segnalato → Risolto`; `segnalazioni.test.ts` › `#2` | passa (25/11) |
| 3 | solo il tecnico assegnato modifica | permesso mancante | tecnico B su segnalazione assegnata al tecnico A | **404** (vedi nota 1), stato invariato; il tecnico A invece ottiene 200 | integration | `segnalazioni.test.ts` › `#3 tecnico NON assegnato` | passa (25/11), dopo la correzione C3 |
| 4 | risorsa deve esistere | id inesistente | `PATCH /api/segnalazioni/9999/stato` | 404 | integration | `segnalazioni.test.ts` › `#4` | passa (25/11) |
| 5 | dati minimi obbligatori | body malformato | `POST /api/segnalazioni` senza `titolo` | 400 `VALIDATION_ERROR`, nessuna riga scritta | unit + integration | `validation.test.ts`; `segnalazioni.test.ts` › `#5` | passa (25/11) |
| 6 | il segnalatore vede il nuovo stato | lettura dopo il cambio | segnalatore legge la propria segnalazione | 200 con lo stato aggiornato e lo storico | integration | `visibilita.test.ts` › `il segnalatore vede solo le segnalazioni che ha creato`; `segnalazioni.test.ts` › `dettaglio` | passa (25/11) |
| 7 | un tecnico vede solo i suoi interventi (bug 42) | isolamento dei dati | tecnico B chiama `GET /api/segnalazioni` | solo le assegnate a B; `?tecnicoId=A` non allarga | integration | `visibilita.test.ts` › `bug 42 …`, `il filtro tecnicoId non scavalca …` | passa (25/11), prima falliva |
| 8 | filtro periodo inclusivo (bug 43) | caso limite sulle date | `?al=2026-10-01`, segnalazione del 1/10 alle 15:30 | inclusa | integration | `filtro-periodo.test.ts` (3 test) | passa (25/11), prima falliva |
| 9 | solo utenti autenticati | richiesta anonima o con token falso | nessun token, token scaduto, manomesso, vecchio `x-user-id` | 401 | unit + integration | `token.test.ts`; `auth.test.ts`; `visibilita.test.ts` › `letture senza autenticazione` | passa (25/11) |
| 10 | login non rivela gli account | credenziali errate | password sbagliata vs email inesistente | stesso 401, stesso corpo; 429 dopo 5 tentativi | integration | `auth.test.ts` | passa (25/11) |
| 11 | assegnazione a uno o più tecnici | backlog voce 4 | Responsabile assegna A e B | 201, 2 assegnazioni, 2 righe `ASSEGNAZIONE` in audit; 403 per Tecnico/Segnalatore; 409 se già assegnato; 400 se chiusa | integration | `assegnazioni.test.ts` (10 test) | passa (25/11) |
| 12 | audit immutabile | integrità del log | `UPDATE`/`DELETE` su `log_audit`, anche da proprietario | rifiutato dal trigger | integration | `privilegi-db.test.ts` | passa (25/11) |
| 13 | log senza dati sensibili | logging sicuro | login + cambio stato con log a livello `info` | righe JSON con `userId`/`requestId`, nessuna password, token o email | integration | `log.test.ts` | passa (25/11) |
| 14 | l'app non parte con configurazione sbagliata | fail-fast | manca `DATABASE_URL` o `AUTH_SECRET` < 32 caratteri | errore che nomina la variabile | unit | `config.test.ts` | passa (25/11); verificato anche a mano: `node server.js` esce con codice 1 |

Esecuzione del 25/11/2026: **108 test, 108 passati** (11 file, ~4 s).

## Note

1. **Riga 3, 404 invece di 403.** La matrice v0.1 prevedeva 403. Il tecnico
   non assegnato non può nemmeno *vedere* la segnalazione (riga 7), quindi gli
   rispondiamo come se non esistesse: un 403 confermerebbe che quell'id
   esiste. Un Segnalatore che prova a cambiare stato riceve invece 403, perché
   il suo ruolo non può farlo in nessun caso.
2. **Cosa abbiamo scoperto scrivendo i test.** Il filtro `al` escludeva il
   giorno indicato (bug 43). La lista restituiva a chiunque tutte le
   segnalazioni, con le email (bug 42, criticità C2). `next.config.mjs` faceva
   ignorare `next.config.ts` senza avvisi.
3. **Aperto col cliente.** Il requisito non chiarisce se il segnalatore debba
   ricevere una notifica attiva al cambio di stato, o se basti vederlo
   ricaricando. Resta da chiarire anche cosa succede se un responsabile
   riassegna mentre il tecnico sta cambiando stato: oggi il cambio di stato ha
   un lock ottimistico (409), l'assegnazione no. Va chiesto anche se il
   "giorno" dei filtri debba seguire il fuso Europe/Rome.
4. **Non coperto da test automatici.** Il frontend: le pagine sono state
   provate solo con build, lint e chiamate reali attraverso il proxy di Vite,
   senza test di interfaccia. Il deploy su MicroK8s si verifica con
   `k8s/rilascio-rollback.md`.
