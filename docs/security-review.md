# Security review — Smart Maintenance (Gestione interventi)

| | |
|---|---|
| **Progetto / cliente** | Smart Maintenance (NordFacility S.r.l.) |
| **Team compilatore** | Team 1 — SimoRighi, manuel, nat, nicola, rzamp |
| **Progetto revisionato** | Proprio progetto (autovalutazione), branch `k8s` @ `559e118` |
| **Data** | 25/11/2026 |
| **Versione** | 1.0 |

*Compilate questo file due volte per lo stesso team: una come autovalutazione
sul vostro progetto, una come review ricevuta dall'altro team. Se usate due
file, incollate qui sotto entrambi i risultati con l'intestazione sopra
aggiornata per ciascuno.*

> Questa è l'**autovalutazione**. La review del team revisore va aggiunta
> sotto, con la propria intestazione.

## Checklist

Per ogni voce: rispondete **Sì / No / Parziale**, indicate come l'avete
verificato (endpoint provato, file letto, comando eseguito) e, se "No" o
"Parziale", aprite una riga nella tabella delle criticità.

| # | Categoria | Domanda verificabile | Risposta | Evidenza |
|---|---|---|---|---|
| 1 | Autenticazione | Chiamando un endpoint protetto senza token/sessione valida, ottengo un rifiuto (401) e non il dato? | **Parziale** | `POST /api/segnalazioni` e `PATCH /api/segnalazioni/:id/stato` senza header `x-user-id` → 401 `UNAUTHORIZED` (`web/src/server/auth.ts:30`). Però l'"identità" è un intero scelto dal client: `x-user-id: 1` basta per diventare l'utente 1, senza password né token (`auth.ts:27-36`). Le letture `GET /api/segnalazioni`, `GET /api/segnalazioni/:id`, `/api/luoghi`, `/api/categorie`, `/api/stati`, `/api/priorita` non richiedono nulla. → C1, C2 |
| 2 | Autorizzazione per ruolo | Chiamando un endpoint con un token valido ma di un ruolo che non dovrebbe poter eseguire l'operazione, ottengo 403 e non l'esecuzione? | **Parziale** | `requireRole()` (`auth.ts:45`) è applicato su entrambe le scritture. Esempio: `PATCH /api/segnalazioni/5/stato` con `x-user-id` di un Segnalatore → 403 `FORBIDDEN` (`stato/route.ts:32`). Manca invece il controllo sul *proprietario*: un Tecnico può cambiare lo stato di una segnalazione non assegnata a lui (`segnalazioni.service.ts:182`, nessun controllo su `assegnazioni`). L'endpoint di assegnazione non esiste ancora. → C3 |
| 3 | Validazione input lato server | Inviando all'API, senza passare dal form, un valore fuori dai valori ammessi o di tipo sbagliato, il server rifiuta con 400 e un messaggio specifico? | **Sì** | Schemi zod in `web/src/server/validation/segnalazioni.ts`. `POST /api/segnalazioni` con `{"titolo":"ab","luogoId":"abc"}` → 400 `VALIDATION_ERROR` con `details` = issue zod per campo (`http.ts:32`). Body non JSON → 400 `Body JSON non valido` (`http.ts:66`). FK inesistente → 400 `INVALID_REFERENCE`. Transizione di stato non ammessa → 400 con l'elenco degli stati ammessi (`segnalazioni.service.ts:195`). `pageSize` limitato a 100. |
| 4 | Secret fuori dal codice | Cercando `password`, `key`, `secret`, `token` nel codice e in `git log -p`, non trovo valori reali, solo riferimenti a variabili d'ambiente? | **Sì** | `git log --all -p \| grep -iE 'password\|secret\|token\|postgresql://'`: solo segnaposto (`k8s/secret-example.yaml`, `config/dev.env` e `config/test.env` con `[PASSWORD]`, `postgresql://finto:finto@…` nel Dockerfile). `DATABASE_URL` letta da `process.env` (`web/src/server/db.ts:10`) e iniettata dal Secret (`k8s/deployment-web.yaml`, `envFrom.secretRef`). `.env*` e `k8s/secret.yaml` sono in `.gitignore`. Unica nota: `web/prisma/seed.ts:16` contiene la password demo `"password"`, solo per lo sviluppo. |
| 5 | Dipendenze | Esiste un lockfile committato e uno strumento di controllo vulnerabilità è stato eseguito, con esito noto, prima di oggi? | **Parziale** | Lockfile committati: `web/package-lock.json`, `frontend/frontendGestione/package-lock.json`; i Dockerfile usano `npm ci`. `npm audit` **non era mai stato eseguito prima di oggi**. Esito del 25/11/2026: frontend 0 vulnerabilità. Backend 7 (1 critical, 5 high, 1 moderate): `next@16.4.0` (critical, RCE e cache poisoning, fix in 16.4.6), poi `prisma`/`@prisma/config` → `effect`, `deepmerge-ts`, `mysql2` (high, transitive), `fast-uri` (moderate). → C4 |
| 6 | Logging sicuro | Aprendo i log di un'operazione recente trovo chi/cosa/quando/su cosa, senza password, token o dati personali non necessari? | **Parziale** | Non ci sono log applicativi delle operazioni riuscite: l'unico log è `console.error(err)` sugli errori 500 (`http.ts:45`, `health/route.ts:11`), senza utente, endpoint o id della richiesta. Gli errori Prisma possono riportare dettagli della query. Nessun livello di log configurabile. Le password non finiscono nelle risposte (`utentePubblico` esclude `passwordHash`, `segnalazioni.service.ts:39`). → C5 |
| 7 | Tracciabilità delle operazioni | Per un'operazione sensibile (assegnazione, cambio stato, cambio ruolo) esiste una riga di log che permette di ricostruire chi l'ha fatta e quando? | **Parziale** | Creazione e cambio stato scrivono `log_audit` (azione, tabella, chiave, valore prima/dopo, `utenteId`, `dataOra`) e `storico_stato` nella **stessa transazione** dell'operazione (`segnalazioni.service.ts:163`, `:212`, `:223`). Però l'`utenteId` registrato viene dall'header falsificabile (C1), quindi il "chi" non è affidabile. Assegnazione e cambio ruolo non sono ancora implementati. `log_audit` è "immutabile" solo per convenzione: il DB non lo impedisce (C6). |

## Criticità trovate

*Una riga per ogni "No" o "Parziale" della checklist. `Corretta` si spunta solo
quando la modifica è nel codice, non quando è solo pianificata.*

| ID | Categoria | Descrizione | Dove (file/endpoint) | Corretta | Riferimento (commit/diff) |
|---|---|---|---|---|---|
| C1 | Autenticazione | L'utente è identificato dall'header `x-user-id` scelto dal client: chiunque raggiunga `/api` può impersonare qualsiasi utente, anche un Amministratore. `passwordHash` esiste in DB ma non viene mai verificato. | `web/src/server/auth.ts:27` | No | — (rilevata su `559e118`) |
| C2 | Autenticazione / riservatezza | Gli endpoint di lettura sono pubblici e restituiscono tutte le segnalazioni con nome, cognome ed email di segnalatori, tecnici e responsabili. | `GET /api/segnalazioni` (`route.ts:25`), `GET /api/segnalazioni/:id` (`[id]/route.ts:24`), `segnalazioni.service.ts:39` | No | — |
| C3 | Autorizzazione per ruolo | Un Tecnico può cambiare lo stato di qualunque segnalazione, anche non assegnata a lui: manca il controllo sul proprietario/assegnazione lato server. | `PATCH /api/segnalazioni/:id/stato`, `segnalazioni.service.ts:182` | No | — |
| C4 | Dipendenze | `next@16.4.0` ha vulnerabilità note, inclusa una critical (RCE): fix disponibile in `16.4.6`. Ci sono anche vulnerabilità high transitive in `prisma`. Non c'era nessun controllo vulnerabilità prima di oggi. | `web/package.json:20`, `web/package-lock.json` | No | — |
| C5 | Logging sicuro | Nessun log strutturato delle operazioni (chi/cosa/quando/endpoint). Gli errori 500 sono stampati interi con `console.error`. | `web/src/server/http.ts:45` | No | — |
| C6 | Tracciabilità / privilegi DB | `log_audit` è dichiarato immutabile solo con un commento. L'app si connette con un utente DB con privilegi ampi (i template usano `postgres`) e potrebbe quindi modificare o cancellare l'audit. | `web/prisma/schema.prisma:235`, `config/*.env`, Supabase | No | — |
| C7 | Dipendenze (terze parti a runtime) | Swagger UI caricato da CDN senza Subresource Integrity, ed esposto anche nel cluster. | `web/src/app/api/docs/route.ts:3` | No | — |
| C8 | Configurazione deploy | Nel cluster il container esegue `next dev` (dev server) invece di `next build` + `next start`. L'Ingress espone solo HTTP, senza TLS, quindi `x-user-id` e i dati passano in chiaro. | `web/Dockerfile` (`CMD`), `k8s/ingress.yaml` | No | — |

## Note per chi legge questa review

*Se questa checklist l'ha compilata un altro team sul vostro progetto: qui
scrivete come avete usato le loro segnalazioni — cosa avete corretto subito,
cosa avete rimandato e perché, non solo "grazie, fatto".*

Questa è un'autovalutazione: tutte le criticità sono aperte al commit
`559e118`. Le verifiche sono state fatte leggendo il codice e la storia Git
(`git log --all -p`) ed eseguendo `npm audit --omit=dev` su `web/` e
`frontend/frontendGestione/`. Gli esiti HTTP indicati (401/403/400) vengono dal
codice delle route e vanno confermati con le richieste in `web/requests.http`.

Priorità che ci diamo:

1. **Subito**, perché è un aggiornamento di patch: C4, cioè `next` → `16.4.6`
   ed `npm audit` ripetuto.
2. **Prima di qualsiasi rilascio al cliente**: C1 e C2 (autenticazione vera
   con sessione o JWT, letture protette, email visibili solo ai ruoli che ne
   hanno bisogno) e C3 (filtro per assegnazione in `cambiaStato`). Finché C1
   resta aperta, C3 e la tracciabilità (#7) non hanno valore, perché il "chi"
   è falsificabile.
3. **Backlog**: C5 (logger strutturato), C6 (utente DB dedicato e
   `REVOKE UPDATE, DELETE ON log_audit`), C7 (attributo `integrity` o Swagger
   disattivato in produzione) e C8 (immagine di produzione e TLS sull'Ingress).
