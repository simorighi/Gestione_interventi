# Security review — Smart Maintenance (Gestione interventi)

| | |
|---|---|
| **Progetto / cliente** | Smart Maintenance (NordFacility S.r.l.) |
| **Team compilatore** | Team 1: SimoRighi, manuel, nat, nicola, rzamp |
| **Progetto revisionato** | Proprio progetto (autovalutazione), `main` dopo il merge di `k8s` |
| **Data** | 25/11/2026 |
| **Versione** | 2.0. La v1.0 (stesso giorno) aveva trovato le criticità C1–C8 sul commit `559e118`; questa versione registra le correzioni |

*Compilate questo file due volte per lo stesso team: una come autovalutazione
sul vostro progetto, una come review ricevuta dall'altro team.*

> Questa è l'**autovalutazione**. La review del team revisore va aggiunta
> in fondo, con la propria intestazione.

## Superficie esposta

Tutto ciò che un utente non fidato può raggiungere dal browser o con `curl`,
nel cluster dietro `https://nordfacility.local` e in locale su `:3000`/`:5173`.

| Punto d'ingresso | Chi può chiamarlo | Dati in ingresso | Controlli |
|---|---|---|---|
| `GET /` (SPA, nginx) | chiunque | percorso | file statici, nessun dato. Le API sono chiamate dal browser con il token |
| `GET /api/health` | chiunque | — | restituisce solo `ok`/`down`, nessun dettaglio dell'errore |
| `POST /api/auth/login` | chiunque | email, password | zod, bcrypt, stesso 401 per email e password sbagliate, 429 dopo 5 errori/15', limite 20 req/min per IP sull'Ingress |
| `GET /api/auth/me` | token valido | header `Authorization` | firma HMAC + scadenza, utente riletto dal DB |
| `GET /api/stati`, `/categorie`, `/priorita`, `/luoghi` | token valido | — | solo lettura |
| `GET /api/tecnici` | Responsabile, Amministratore | — | `requireRole`, nessuna email |
| `GET /api/segnalazioni`, `/{id}` | token valido | query string, id | zod, `filtroVisibilita` nella query, 404 fuori perimetro |
| `POST /api/segnalazioni` | Segnalatore, Responsabile, Amministratore | body JSON | zod, FK verificate, transazione + audit |
| `PATCH /api/segnalazioni/{id}/stato` | Responsabile, Amministratore, Tecnico assegnato | body JSON | zod, workflow, controllo assegnazione, lock ottimistico, audit |
| `POST /api/segnalazioni/{id}/assegnazioni` | Responsabile, Amministratore | body JSON | zod, tecnici esistenti e attivi, transazione + audit |
| `GET /api/docs`, `/api/openapi.json` | chiunque **solo in sviluppo** | — | spenti in produzione (`API_DOCS`), JS da CDN con SRI |
| Preflight `OPTIONS /api/*` | browser | `Origin` | solo le origini in `CORS_ORIGIN` (vuota nel cluster) |
| PostgreSQL (Supabase) | solo il backend | SQL di Prisma | credenziali dal Secret, utente `nordfacility_app` con privilegi minimi, trigger sull'audit |

Fuori dalla superficie: nessun upload di file (gli allegati non sono ancora
implementati), nessuna chiamata a servizi AI esterni.

## Checklist

Per ogni voce: **Sì / No / Parziale**, come l'abbiamo verificato, e per "No" o
"Parziale" una riga nella tabella delle criticità. Le verifiche automatiche
sono in `web/tests/`. `npm test` del 25/11 dà 108/108.

| # | Categoria | Domanda verificabile | Risposta | Evidenza |
|---|---|---|---|---|
| 1 | Autenticazione | Chiamando un endpoint protetto senza token/sessione valida, ottengo un rifiuto (401) e non il dato? | **Sì** | Tutti gli endpoint tranne `health` e `login` chiamano `getCurrentUser` (`web/src/server/auth.ts:59`), che accetta solo `Authorization: Bearer` con firma HMAC-SHA256 valida e non scaduto (`src/server/token.ts`). Test: `auth.test.ts` (token manomesso, scaduto, schema Basic, vecchio `x-user-id` → 401) e `visibilita.test.ts` › `letture senza autenticazione`. Verificato anche sul build di produzione con `curl`: `GET /api/segnalazioni` senza token → 401, con `x-user-id: 4` → 401. |
| 2 | Autorizzazione per ruolo | Chiamando un endpoint con un token valido ma di un ruolo che non dovrebbe poter eseguire l'operazione, ottengo 403 e non l'esecuzione? | **Sì** | `requireRole` su tutte le scritture e su `/api/tecnici`. Controllo sul proprietario: `filtroVisibilita` (`segnalazioni.service.ts:39`) per le letture e `soloAssegnate` (`:204`) nel cambio stato. Test: Segnalatore che cambia stato → 403; Tecnico/Segnalatore che assegnano → 403 (`assegnazioni.test.ts`); tecnico non assegnato → 404, stato invariato (`segnalazioni.test.ts` › `#3`). Con `curl` sul build di produzione: tecnico su segnalazione non sua → 404, dopo l'assegnazione → 200. |
| 3 | Validazione input lato server | Inviando all'API, senza passare dal form, un valore fuori dai valori ammessi o di tipo sbagliato, il server rifiuta con 400 e un messaggio specifico? | **Sì** | Schemi zod in `web/src/server/validation/` per ogni body e query. Test: `validation.test.ts` (18 casi), `segnalazioni.test.ts` (campo mancante, JSON non valido, FK inesistente), `assegnazioni.test.ts` (`[]`, `[1,1]`, `"abc"`). Errore Prisma inatteso → 500 generico, dettagli solo nel log. |
| 4 | Secret fuori dal codice | Cercando `password`, `key`, `secret`, `token` nel codice e in `git log -p`, non trovo valori reali, solo riferimenti a variabili d'ambiente? | **Sì** | `git log --all -p` (main, k8s, API_Call, manuel) cercato con `password\|secret\|token\|postgres(ql)?://`, `[a-z0-9]{20}\.supabase\.co`, `pooler\.supabase\.com`, `eyJ…`: solo segnaposto (`[PASSWORD]`, `<PASSWORD>`, `password-di-esempio`). `DATABASE_URL` e `AUTH_SECRET` sono lette solo da `src/server/config.ts` e arrivano dal Secret. `.env*`, `k8s/secret.yaml`, `*.key`/`*.crt`/`*.pem` sono in `.gitignore`. Il Dockerfile non contiene più nemmeno la `DATABASE_URL` finta. Resta la password demo `"password"` in `prisma/seed.ts`, solo per gli utenti di sviluppo. |
| 5 | Dipendenze | Esiste un lockfile committato e uno strumento di controllo vulnerabilità è stato eseguito, con esito noto, prima di oggi? | **Sì** (da oggi) | Lockfile committati, `npm ci` nei Dockerfile. `npm audit` del 25/11 dopo le correzioni: backend **0** (prima 7: `next` 16.4.0 → 16.4.6, override `effect ^3.22.5` per Prisma), frontend **0** (prima 9 moderate su `minimatch`). Script `npm run audit` aggiunto. Prima di oggi il controllo non era mai stato fatto: va ripetuto a ogni PR. |
| 6 | Logging sicuro | Aprendo i log di un'operazione recente trovo chi/cosa/quando/su cosa, senza password, token o dati personali non necessari? | **Sì** | `src/server/log.ts`: una riga JSON per richiesta con `ts`, `requestId`, `userId`, `method`, `path`, `status`, `durationMs`, più `LOGIN` / `LOGIN_FALLITO`. Header, body, token ed email non vengono mai scritti. Errori 500: nome, messaggio e stack solo nel log; al client va un messaggio generico con `x-request-id`. Test: `log.test.ts` verifica che password, token ed email non compaiano. |
| 7 | Tracciabilità delle operazioni | Per un'operazione sensibile (assegnazione, cambio stato, cambio ruolo) esiste una riga di log che permette di ricostruire chi l'ha fatta e quando? | **Parziale** | Creazione, cambio stato e **assegnazione** scrivono `log_audit` nella stessa transazione, con l'`utenteId` del token (non più falsificabile). `log_audit` è protetto da un trigger contro UPDATE/DELETE (`prisma/sql/01-audit-immutabile.sql`, test `privilegi-db.test.ts`). Non c'è ancora un endpoint per **cambiare ruolo** (→ C9). Il trigger e l'utente limitato vanno ancora applicati su Supabase (→ C6). |

## Criticità trovate

`Corretta` si spunta solo quando la modifica è nel codice, non quando è solo
pianificata.

| ID | Categoria | Descrizione | Dove (file/endpoint) | Corretta | Riferimento (commit/diff) |
|---|---|---|---|---|---|
| C1 | Autenticazione | Utente identificato dall'header `x-user-id` scelto dal client: chiunque poteva impersonare chiunque. | `web/src/server/auth.ts` | **Sì** | `200ca58` Aggiunge login con token firmato |
| C2 | Autenticazione / riservatezza | Letture pubbliche, con tutte le segnalazioni e le email. | `GET /api/segnalazioni`, `/{id}`, anagrafiche | **Sì** | `77dcaa0` Protegge letture, filtra per ruolo (bug 42) |
| C3 | Autorizzazione per ruolo | Un Tecnico poteva cambiare lo stato di qualunque segnalazione. | `PATCH /api/segnalazioni/:id/stato` | **Sì** | `aedc5f1` Limita cambio stato ai tecnici assegnati |
| C4 | Dipendenze | `next@16.4.0` con vulnerabilità critical, high transitive in `prisma`, nessun audit. | `web/package.json` | **Sì** | `82d6c63` Aggiorna next, corregge vulnerabilità; `0cccddb` frontend |
| C5 | Logging sicuro | Nessun log strutturato; errori 500 stampati interi con `console.error`. | `web/src/server/http.ts` | **Sì** | `28b8726` Aggiunge log strutturato delle richieste |
| C6 | Tracciabilità / privilegi DB | `log_audit` immutabile solo per convenzione; app connessa come `postgres`. | `prisma/schema.prisma`, Supabase | **Parziale** | `6efa805` Rende audit immutabile, utente DB limitato. Script scritti e verificati nei test; **da eseguire su Supabase** e da mettere `nordfacility_app` nel Secret |
| C7 | Dipendenze a runtime | Swagger UI da CDN senza SRI, esposto nel cluster. | `web/src/app/api/docs/route.ts` | **Sì** | `27045b6` Swagger con SRI, spento in produzione |
| C8 | Configurazione deploy | Nel cluster `next dev`; Ingress solo HTTP. | `web/Dockerfile`, `k8s/ingress.yaml` | **Sì** nel codice | `5d32151` Dockerfile di produzione standalone; `1420942` TLS su Ingress. **Da applicare sul cluster** (`k8s/rilascio-rollback.md`) |
| C9 | Tracciabilità | Nessun endpoint/audit per la modifica dei ruoli utente; il frontend "Impostazioni" usa ancora dati finti. | `frontend/.../Impostazioni.tsx` | No | backlog |
| C10 | Autenticazione | Limite tentativi di login in memoria: vale per replica. Mitigato dal limite sull'Ingress, ma non condiviso tra Pod. Nessuna revoca dei token prima della scadenza (8 h), salvo disattivare l'utente o cambiare `AUTH_SECRET`. | `web/src/server/auth.ts:93` | Parziale | accettato per ora |
| C11 | Configurazione | Durante il merge di `k8s` è emerso che `next.config.mjs` faceva ignorare `next.config.ts` e chiudeva il processo senza `CORS_ORIGIN`, che i manifest k8s non definivano: i Pod non sarebbero partiti. | `web/next.config.*` | **Sì** | `5328153` Unifica config Next, CORS runtime |

## Note per chi legge questa review

Le criticità della v1.0 sono state corrette nell'ordine di priorità che ci
eravamo dati: prima le dipendenze (C4), poi autenticazione e autorizzazione
(C1–C3, con i test che le bloccano), poi il resto.

Restano due azioni **fuori dal repository**, che il codice non può fare da solo:

1. **Supabase** (amministratore del progetto): eseguire
   `web/prisma/sql/01-audit-immutabile.sql` e `02-utente-applicativo.sql` dal SQL
   editor, impostare la password di `nordfacility_app` e metterla nel Secret.
2. **Cluster** (chi ha MicroK8s): creare il Secret TLS e aggiungere
   `AUTH_SECRET` al Secret, poi rilasciare la 1.1.0 ed eseguire davvero il
   rollback (`k8s/rilascio-rollback.md`), compilando le tabelle degli esiti.

Fino ad allora C6 e C8 restano "corrette nel codice" ma non in esercizio.

---

## Review ricevuta dal team revisore

*(da compilare dall'altro team: stessa checklist, stessa tabella delle criticità)*
