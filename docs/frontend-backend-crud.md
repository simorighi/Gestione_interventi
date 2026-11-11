# Flusso Frontend-Backend e gestione CRUD

Questa guida descrive l'integrazione attuale delle schermate con il backend,
l'autenticazione e i passaggi necessari per configurare il database di test.

## Architettura e avvio

```text
Browser: React + Vite (localhost:5173)
  └── /api/* -> proxy Vite -> Next.js (localhost:3000)
                    ├── Supabase Auth
                    └── Prisma -> PostgreSQL su Supabase
```

Avviare i processi in due terminali:

```powershell
cd web
npm install
npm run dev
```

```powershell
cd frontend/frontendGestione
npm install
npm run dev
```

Il frontend usa URL relativi `/api/*`; per un backend su un'altra porta o host
si può impostare `VITE_BACKEND_URL`.

## Configurazione ambiente

Configurare le variabili in file locali non committati:

`web/.env`:

```dotenv
DATABASE_URL=postgresql://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<chiave-pubblica-anon>
SUPABASE_SERVICE_ROLE_KEY=<chiave-service-role>
```

`frontend/frontendGestione/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<chiave-pubblica-anon>
```

Usare gli stessi URL e progetto Supabase. La chiave `anon` è pubblica e viene
usata dal browser; `SUPABASE_SERVICE_ROLE_KEY` è un segreto e deve rimanere
esclusivamente nel backend. Non creare variabili `VITE_*` per password, chiavi
di servizio o `DATABASE_URL`. Dopo aver modificato gli env, riavviare entrambi i
server di sviluppo.

La pagina di salute (`/api/health`) verifica la connessione PostgreSQL; un
risultato `200` non verifica che migrazione, seed e account di autenticazione
siano stati completati.

## Supabase e primo accesso

Il frontend esegue il login con Supabase Auth. Il backend verifica il bearer
token presso Supabase, associa l'email autenticata a un utente attivo nella
tabella applicativa `utente` e ricava i ruoli dal database. L'ID utente o il
ruolo inviati dal browser non sono usati come credenziali.

Per abilitare il primo accesso:

1. Crea in Supabase Auth un account con l'email di un utente applicativo attivo
   che abbia il ruolo `Amministratore`. Puoi usare la dashboard Supabase.
2. Usa la stessa email e la password scelta nel form di login.
3. Dopo l'accesso, gli amministratori possono creare utenti dall'interfaccia.
   La creazione usa Supabase Admin API lato server e richiede
   `SUPABASE_SERVICE_ROLE_KEY`.

Il seed Prisma crea gli utenti applicativi, non identità Supabase Auth. Per il
bootstrap iniziale, email e password devono quindi essere impostate anche in
Supabase Auth. Non eseguire scritture di prova sul database di produzione.

## Migrazione necessaria

Le API CRUD dipendono dai campi `archived_at` e dalla tabella
`stato_transizione`. Prima di usare le funzioni CRUD:

1. Apri `web/prisma/manual-migrations/20261029_crud_and_workflow.sql`.
2. Applica la migrazione sul database di test tramite Supabase SQL Editor.
3. Da `web`, esegui `npm run db:pull` per riallineare schema Prisma e client.

Il repository considera Supabase la fonte di verità: non usare
`prisma migrate` su questo database. Verifica prima di applicare la SQL che il
progetto Supabase selezionato sia quello di test; la migrazione aggiunge campi e
inizializza le transizioni standard del workflow.

## Funzioni collegate

| Schermata | Dati e operazioni |
|---|---|
| Dashboard | Segnalazioni, statistiche e stato API/database. |
| Lista segnalazioni | Ricerca e filtri server-side, elenco e accesso al dettaglio. |
| Nuova segnalazione | Carica categorie, priorità e luoghi; invia la nuova segnalazione. |
| Dettaglio segnalazione | Dettaglio, modifica, transizioni consentite, note e assegnazioni; archiviazione logica secondo i permessi. |
| Tecnici | Elenco, aggiornamento dati e disattivazione; i tecnici restano come record storico. |
| Edifici e impianti | Creazione/modifica luoghi e archiviazione logica con controlli sulla gerarchia e sui riferimenti attivi. |
| Impostazioni | Gestione categorie, utenti e workflow. SMTP, AI e backup sono segnalati come non collegati e non simulano salvataggi. |
| Stato e dati | Diagnostica e operazioni di prova sui dati disponibili tramite API. |

Le entità operative vengono archiviate/disattivate anziché eliminate
fisicamente. Le route server applicano validazione Zod e autorizzazione per
ruolo; nascondere azioni nell'interfaccia non sostituisce i controlli backend.
La gestione allegati/upload non è ancora implementata.

## API principali

Le route sono in `web/src/app/api/`; le regole applicative e l'accesso Prisma
sono in `web/src/server/`.

| API | Utilizzo |
|---|---|
| `GET /api/health` | Stato backend e connessione database. |
| `GET /api/categorie`, `GET /api/priorita`, `GET /api/stati`, `GET /api/luoghi` | Anagrafiche usate dai form. |
| `GET/POST /api/segnalazioni` | Lista filtrata e creazione. |
| `GET/PATCH/DELETE /api/segnalazioni/{id}` | Dettaglio, modifica e archiviazione logica con motivo. |
| `PATCH /api/segnalazioni/{id}/stato` | Cambio stato ammesso dal workflow. |
| `/api/segnalazioni/{id}/note`, `/api/note/{id}` | Creazione, modifica e archiviazione note. |
| `/api/segnalazioni/{id}/assegnazioni`, `/api/assegnazioni/{id}` | Assegnazioni e rimozione logica. |
| `/api/luoghi`, `/api/luoghi/{id}` | Elenco, creazione, modifica e archiviazione luoghi. |
| `/api/categorie`, `/api/categorie/{id}` | Elenco, creazione e modifica/disattivazione categorie. |
| `/api/tecnici`, `/api/tecnici/{id}` | Gestione dei profili tecnici. |
| `/api/utenti`, `/api/utenti/{id}` | Gestione amministrativa utenti e provisioning Supabase Auth. |
| `/api/workflow/stati`, `/api/workflow/transizioni` | Configurazione amministrativa del workflow. |
| `GET /api/auth/me` | Profilo applicativo corrispondente alla sessione autenticata. |

La specifica interattiva resta disponibile da backend in `/api/docs`; i dettagli
OpenAPI vanno mantenuti allineati alle route man mano che queste evolvono.

## Manutenzione e diagnosi

- Se `/api/health` restituisce `503`, controllare il processo Next.js, `DATABASE_URL`
  e la raggiungibilità del database.
- Se il login non riesce, verificare URL/chiave anon, credenziali Supabase Auth,
  email corrispondente e stato/ruolo dell'utente applicativo.
- Se le API restituiscono errori di schema o tabelle mancanti, controllare che
  la migrazione sia stata applicata e poi eseguire `npm run db:pull`.
- Le route richiedono un bearer token Supabase; per le scritture verificare
  inoltre che il ruolo dell'utente sia autorizzato.
- Impostare solo segreti di test in locale e non copiare chiavi o password nei
  log, issue o documentazione.
