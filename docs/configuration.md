# Configurazione — NordFacility

| | |
|---|---|
| **Progetto** | NordFacility — Gestione Interventi |
| **Team** | Team NordFacility |
| **Data** | 28/10/2026 |
| **Versione** | v1.0 |

## Variabili d'ambiente

| Variabile | Scopo | Default | Obbligatoria | Ambiente(i) |
|---|---|---|---|---|
| `DATABASE_URL` | Stringa di connessione PostgreSQL a Supabase (usata da Prisma e dall'app) | *nessuno* | **Sì** | DEV/TEST/PROD — credenziali e database dedicati per ciascun ambiente |
| `PORT` | Porta su cui il backend Node.js/Express resta in ascolto | `8080` | **No** | Uguale in tutti gli ambienti (o definita dall'orchestratore) |
| `LOG_LEVEL` | Livello di verbosità dei log applicativi (`debug`, `info`, `warn`, `error`) | `info` | **No** | DEV (`debug`), TEST (`info`), PROD (`warn`) |
| `CORS_ORIGIN` | Origine esatta del frontend autorizzata dal backend per richieste HTTP | *nessuno* | **Sì** | DEV/TEST/PROD — coincide con la URL reale del frontend in quell'ambiente |

## Dove vive la configurazione, per ambiente

### DEV
* **Posizione**: File `web/.env` letto all'avvio del processo locale o via Docker (`docker run --env-file`).
* **Caratteristiche**: Il file `.env` non è versionato ed è escluso da Git tramite `.gitignore`. Punta al database Supabase di sviluppo/test con log in modalità `debug` e `CORS_ORIGIN=http://localhost:5173`.

### TEST
* **Posizione**: Variabili d'ambiente definite nel manifest di Deployment o tramite `Secret` e `ConfigMap` di Kubernetes (es. MicroK8s).
* **Caratteristiche**: `DATABASE_URL` è iniettata in modo sicuro tramite un Secret K8s (valori codificati in base64). `CORS_ORIGIN` è impostata sull'URL dell'ambiente di test (es. `https://test.nordfacility.it`).

## Secret

I dati sensibili (come la password del database contenuta in `DATABASE_URL`) seguono le seguenti regole rigorose:
* **Codice & Git**: Nessun secret è presente nel codice sorgente né nei file di configurazione versionati (`.env.example` contiene solo placeholder come `[PASSWORD]`).
* **Ambiente DEV**: Vivono nel file locale `web/.env`, ignorato dal controllo di versione.
* **Ambiente TEST / PROD**: Le credenziali vengono fornite tramite l'oggetto `Secret` di Kubernetes montato come variabile d'ambiente nel pod, garantendo la separazione delle responsabilità tra sviluppo e operations.

## Comportamento all'avvio

All'avvio dell'applicazione (`src/server/db.ts` o `config.js`), il sistema esegue la validazione immediata della presenza delle variabili d'ambiente obbligatorie (`DATABASE_URL`, `CORS_ORIGIN`):
* Se una variabile obbligatoria manca, il processo scrive un messaggio esplicito su `stderr` (es. `Configurazione mancante: DATABASE_URL`) e si arresta immediatamente con codice d'uscita non nullo (`process.exit(1)`).
* Questo evita che l'applicazione inizi a servire richieste in uno stato inconsistente o che fallisca tardivamente al primo tentativo di query al database.

## Guasto diagnosticato

Durante la sessione di laboratorio è stato introdotto e analizzato un guasto di configurazione per testare l'isolamento e la diagnostica tra ambienti.

- **Sintomo**: Il frontend non caricava la lista degli interventi e in console del browser appariva l'errore `CORS header 'Access-Control-Allow-Origin' missing` / `Cross-Origin Request Blocked`.
- **Ipotesi**: Il backend in ambiente TEST rifiutava le chiamate perché la variabile `CORS_ORIGIN` non corrispondeva all'indirizzo effettivo del frontend di test.
- **Verifica**: È stato verificato il valore effettivo della variabile dentro il container/pod con il comando:
  ```bash
  docker exec -it backend-container env | grep CORS_ORIGIN
