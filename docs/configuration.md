# Configurazione — NordFacility

| | |
|---|---|
| **Progetto** | NordFacility — Gestione Interventi |
| **Team** | Team NordFacility |
| **Data** | 25/11/2026 |
| **Versione** | v2.0 |

## Variabili d'ambiente

Tutte le variabili sono lette e validate in un solo punto: `web/src/server/config.ts`.

| Variabile | Scopo | Default | Obbligatoria | Ambiente(i) |
|---|---|---|---|---|
| `DATABASE_URL` | Stringa di connessione PostgreSQL (Prisma e app). In TEST/PROD con l'utente limitato `nordfacility_app` | *nessuno* | **Sì** (segreta) | DEV/TEST/PROD, un database per ambiente |
| `AUTH_SECRET` | Chiave con cui il backend firma i token di login. Almeno 32 caratteri: `openssl rand -base64 48` | *nessuno* | **Sì** (segreta) | Diversa per ogni ambiente. Se cambia, tutti i token esistenti diventano invalidi |
| `AUTH_TOKEN_TTL_MIN` | Durata di un token di accesso, in minuti (5–1440) | `480` | No | Tutti |
| `PORT` | Porta su cui il backend Next.js resta in ascolto | `3000` | No | Uguale a `containerPort` nel cluster |
| `LOG_LEVEL` | Verbosità dei log JSON (`debug`, `info`, `warn`, `error`) | `info` | No | DEV `debug`, TEST `info`, PROD `info`/`warn` |
| `CORS_ORIGIN` | Origini del frontend ammesse da un **altro** dominio, separate da virgola | *vuota* | No | Vuota in DEV (proxy di Vite) e nel cluster (stesso host dietro l'Ingress) |
| `API_DOCS` | `true`/`false`: serve Swagger UI e `/api/openapi.json` | attiva se `NODE_ENV` ≠ `production` | No | `false` nel cluster |
| `NODE_ENV` | Modalità di Next.js | `production` nell'immagine Docker | No | Impostata dall'immagine, non a mano |

## Dove vive la configurazione, per ambiente

### DEV
* **Posizione**: Copiare `config/dev.env` in `web/.env`; il file `web/.env` è letto all'avvio del processo locale o via Docker (`docker run --env-file`).
* **Caratteristiche**: `config/dev.env` è un template versionato senza credenziali reali. Il file `web/.env` non è versionato ed è escluso da Git tramite `.gitignore`. Usa il database Supabase di sviluppo (o quello locale di `npm run db:locale`) e log `debug`. `CORS_ORIGIN` resta vuota: il frontend su `:5173` chiama `/api` tramite il proxy di Vite, quindi la richiesta è same-origin.

### TEST
* **Posizione**: `config/test.env` documenta i valori attesi. Nel cluster le variabili arrivano da `k8s/configmap.yaml` (parametri) e dal Secret `web-secret` (`DATABASE_URL`, `AUTH_SECRET`).
* **Caratteristiche**: frontend e API sono sullo stesso host dietro l'Ingress HTTPS (`nordfacility.local`), quindi `CORS_ORIGIN` non serve. Swagger è spento (`API_DOCS=false`).

## Secret

I dati sensibili (`DATABASE_URL`, che contiene la password del database, e `AUTH_SECRET`) seguono queste regole:
* **Codice & Git**: Nessun secret è presente nel codice sorgente né nei file di configurazione versionati (`.env.example` contiene solo placeholder come `[PASSWORD]`).
* **Ambiente DEV**: Vivono nel file locale `web/.env`, ignorato dal controllo di versione.
* **Ambiente TEST / PROD**: Le credenziali vengono fornite tramite l'oggetto `Secret` di Kubernetes montato come variabile d'ambiente nel pod, garantendo la separazione delle responsabilità tra sviluppo e operations.
* **Verifica**: il 25/11/2026 `git log --all -p` (tutti i branch) è stato cercato con `password|secret|token|postgres(ql)?://`, host Supabase reali (`<ref>.supabase.co`, `pooler.supabase.com` con utente reale) e JWT (`eyJ…`). Risultato: solo segnaposto (vedi `docs/security-review.md`, voce 4).

## Comportamento all'avvio

All'avvio del server Next.js, `web/src/instrumentation.ts` chiama `validaAllAvvio()` (`web/src/server/config.ts`):
* se una variabile obbligatoria manca o non è valida, il processo scrive su `stderr` **tutte** le variabili sbagliate e il motivo, poi esce con codice 1. Esempio:
  ```
  Configurazione non valida:
    - DATABASE_URL: Configurazione mancante: DATABASE_URL
    - AUTH_SECRET: AUTH_SECRET deve avere almeno 32 caratteri (openssl rand -base64 48)
  ```
* nel cluster questo si vede come Pod in `CrashLoopBackOff`, con il motivo in `kubectl logs`. Il Pod non diventa mai *Ready*, quindi i Pod vecchi continuano a servire (vedi `k8s/rilascio-rollback.md`).
* `npm install`, `prisma generate` e `next build` **non** richiedono variabili: nessun valore finto deve finire nel Dockerfile.

Prima la validazione stava in `next.config.mjs` e controllava solo `CORS_ORIGIN`. Inoltre `next.config.mjs` faceva ignorare silenziosamente `next.config.ts`. Il controllo è stato spostato e completato.

## Guasto diagnosticato

Durante la sessione di laboratorio è stato introdotto e analizzato un guasto di configurazione per testare l'isolamento e la diagnostica tra ambienti.

- **Sintomo**: Il frontend non caricava la lista degli interventi e in console del browser appariva l'errore `CORS header 'Access-Control-Allow-Origin' missing` / `Cross-Origin Request Blocked`.
- **Ipotesi**: Il backend in ambiente TEST rifiutava le chiamate perché la variabile `CORS_ORIGIN` non corrispondeva all'indirizzo effettivo del frontend di test.
- **Verifica**: È stato verificato il valore effettivo della variabile dentro il container/pod con il comando:
  ```bash
  docker exec -it backend-container env | grep CORS_ORIGIN
  ```

- **Causa**: il valore di `CORS_ORIGIN` nel pod TEST era quello dello sviluppo
  (`http://localhost:5173`) e quindi non coincideva con l'origine
  `https://test.nordfacility.it` inviata dal browser. Il backend non aggiungeva
  l'header CORS alla risposta.
- **Correzione**: aggiornare il `ConfigMap`/manifest TEST con
  `CORS_ORIGIN=https://test.nordfacility.it`, riavviare il deployment per
  ricreare i pod e verificare nuovamente il valore con il comando precedente.
  Infine ripetere una richiesta da Swagger UI o dal frontend TEST e controllare
  che la risposta contenga `Access-Control-Allow-Origin` con l'origine attesa.
