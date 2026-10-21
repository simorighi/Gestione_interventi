# Smart Maintenance — backend

Backend delle API per la gestione delle segnalazioni di manutenzione.

**Stack**: Next.js 16 (App Router) · Prisma 7 (ORM) · PostgreSQL su Supabase · zod (validazione)

---

## 1. Avvio rapido

```bash
cd web
npm install          # installa le dipendenze e genera il client Prisma
npm run dev          # avvia su http://localhost:3000
```

Poi apri **http://localhost:3000/api/docs** per provare le API dal browser (vedi §3).

### Il file `.env`

 in `.env` e inserisci la stringa di connessione:

```
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres"
```

Dove trovarla: Supabase → pulsante **Connect** → **Session pooler**.

- Non usare la stringa "Direct connection" (`db.<ref>.supabase.co`): funziona solo in IPv6 e
  su molte reti (scuola, casa) dà `ENOTFOUND`.
- Se la password contiene caratteri speciali vanno codificati: `@` → `%40`, `#` → `%23`, `/` → `%2F`.
- Il file `.env` **non va mai committato** (è già in `.gitignore`).

> Perché non Project URL + anon key? Quelli servono alla libreria `supabase-js`, che passa per la
> REST API di Supabase. Prisma invece si collega direttamente a Postgres, quindi gli serve la
> connection string.

---

## 2. Come è organizzato il codice

Una richiesta HTTP attraversa questi strati, ognuno con un solo compito:

```
Browser / Swagger UI / Postman
        │  HTTP + JSON
        ▼
src/app/api/.../route.ts      ① ROUTE: riceve la richiesta, chiama il service, risponde
        │
        ├── server/auth.ts        ② chi è l'utente? ha il ruolo giusto?
        ├── server/validation/    ③ i dati in ingresso sono validi? (zod)
        ▼
src/server/services/          ④ SERVICE: regole di business e transazioni
        │
        ▼
src/server/db.ts              ⑤ client Prisma: unica connessione al database
        │  SQL
        ▼
Supabase (PostgreSQL)
```

### ① Route handler — `src/app/api/**/route.ts`

In Next.js ogni cartella sotto `src/app/api` diventa un URL, e il file `route.ts` esporta una
funzione per ogni metodo HTTP (`GET`, `POST`, `PATCH`...).

| File | URL |
|---|---|
| `api/segnalazioni/route.ts` | `GET` e `POST /api/segnalazioni` |
| `api/segnalazioni/[id]/route.ts` | `GET /api/segnalazioni/5` (`[id]` = parametro) |
| `api/segnalazioni/[id]/stato/route.ts` | `PATCH /api/segnalazioni/5/stato` |

Le route sono volutamente **corte**: leggono l'input, lo validano, chiamano il service e
restituiscono JSON. **Non contengono logica di business né query.** Esempio:

```ts
export const POST = route(async (request) => {
  const user = await getCurrentUser(request);                         // chi sei
  requireRole(user, RUOLI.SEGNALATORE, RUOLI.RESPONSABILE);           // puoi farlo?
  const input = creaSegnalazioneSchema.parse(await readJson(request)); // dati validi?
  return json(await creaSegnalazione(input, user), { status: 201 });  // fallo
});
```

### ② Autenticazione — `src/server/auth.ts`

- `getCurrentUser(request)`: legge l'utente dall'header `x-user-id` e carica i suoi ruoli dal DB.
- `requireRole(user, ...ruoli)`: se l'utente non ha nessuno dei ruoli → errore 403.
- `RUOLI`: i nomi dei ruoli, **identici** a quelli nella tabella `ruolo`.

⚠️ **È un segnaposto per sviluppo**: chiunque può mandare `x-user-id: 4` e diventare
amministratore. Prima di andare in produzione va sostituito con un login vero
(es. Supabase Auth). Le route non cambieranno: cambia solo l'interno di `getCurrentUser`.

### ③ Validazione — `src/server/validation/`

Schemi [zod](https://zod.dev) che descrivono i dati accettati (tipi, obbligatorietà, lunghezze).
Se i dati non rispettano lo schema, `parse()` lancia un errore che diventa automaticamente
una risposta **400** con l'elenco dei campi sbagliati. Gli stessi schemi generano la
documentazione OpenAPI, quindi documentazione e validazione restano sempre allineate.

### ④ Service — `src/server/services/`

Qui sta la **logica dell'applicazione**: è il posto dove lavorerete di più.

- `segnalazioni.service.ts`
  - `listSegnalazioni`: ricerca con filtri e paginazione
  - `getSegnalazione`: dettaglio con storico, assegnazioni, note, allegati
  - `creaSegnalazione`: crea la segnalazione in stato "Segnalato", scrive la prima riga di
    `storico_stato` e una riga di `log_audit`, tutto in **una transazione** (o tutto o niente)
  - `cambiaStato`: controlla che la transizione sia ammessa dalla macchina a stati
    (`TRANSIZIONI`), aggiorna, scrive storico e audit. Se due utenti cambiano lo stato nello
    stesso momento, il secondo riceve **409** invece di sovrascrivere il primo
- `anagrafiche.service.ts`: letture semplici di categorie, priorità, stati, luoghi

I service non sanno niente di HTTP: possono essere riusati da altre route o da script.

### ⑤ Database — `src/server/db.ts` e `prisma/`

- `db.ts` crea **un solo** client Prisma condiviso. Si usa così: `db.segnalazione.findMany(...)`.
- `prisma/schema.prisma` descrive le tabelle in un formato che Prisma usa per generare il
  client **tipizzato**: se scrivi `db.segnalazione.findMany({ where: { titolp: ... } })`
  l'editor segnala subito l'errore.
- Lo schema è **letto da Supabase** (`prisma db pull`): le tabelle si modificano su Supabase,
  poi si lancia `npm run db:pull`. **Non usare `prisma migrate`** su questo database.
- I nomi nel codice sono in camelCase (`dataCreazione`), nel DB in snake_case
  (`data_creazione`): la corrispondenza è data da `@map` nello schema.

### File di supporto

| File | A cosa serve |
|---|---|
| `src/server/http.ts` | `route()` cattura ogni errore e lo trasforma in JSON uniforme; `json()` risponde gestendo i BigInt; `readJson()` legge il body |
| `src/server/errors.ts` | errori applicativi (`notFound`, `badRequest`, `forbidden`...) con il loro status HTTP |
| `src/server/openapi.ts` | la specifica OpenAPI mostrata in Swagger UI |
| `prisma/seed.ts` | inserisce dati demo (utenti, luoghi, segnalazioni) |
| `prisma.config.ts` | configurazione della CLI Prisma |
| `src/generated/prisma/` | client generato da Prisma: non si modifica e non si committa |

### Formato degli errori

Tutti gli errori hanno la stessa forma, così il frontend li gestisce in un punto solo:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dati non validi", "details": [ ... ] } }
```

| Status | Quando |
|---|---|
| 400 | dati non validi, transizione di stato non ammessa, id inesistente in un riferimento |
| 401 | manca `x-user-id` o l'utente non esiste / non è attivo |
| 403 | l'utente non ha il ruolo richiesto |
| 404 | risorsa non trovata |
| 409 | conflitto (valore duplicato, modifica concorrente) |
| 500 | errore imprevisto (dettagli nel terminale di `npm run dev`) |

---

## 3. Provare le API con Swagger UI (OpenAPI)

1. `npm run dev`
2. Apri **http://localhost:3000/api/docs**
3. Gli endpoint sono raggruppati per sezione. Aprine uno → **Try it out** → compila i campi →
   **Execute**. Sotto vedi la richiesta inviata (anche come comando `curl`) e la risposta reale
   del database.

### Endpoint che scrivono (POST / PATCH)

Richiedono un utente. In alto a destra clicca **Authorize** e inserisci un id utente nel campo
`x-user-id`. Il valore resta salvato anche se ricarichi la pagina.

Gli utenti nel DB all'inizio sono zero. Per crearne di prova: `npm run db:seed`. Il comando
stampa gli id con i ruoli, per esempio:

```
┌─────┬───────────────────────────┐
│ id  │ ruolo                     │
│ 1   │ Segnalatore               │   → può creare segnalazioni
│ 2   │ Tecnico                   │   → può cambiare stato
│ 3   │ Responsabile manutenzione │   → può creare e cambiare stato
│ 4   │ Amministratore            │   → può tutto
└─────┴───────────────────────────┘
```

Il seed scrive sul database condiviso del team (4 utenti demo con password `password`, alcuni
luoghi, 2 segnalazioni). Si può rilanciare senza creare duplicati.

### Un giro di prova completo

1. `GET /luoghi`, `/categorie`, `/priorita`: annota gli id da usare
2. Authorize con l'id del **Segnalatore** → `POST /segnalazioni` → risposta 201 con l'id creato
3. Authorize con l'id del **Responsabile** → `PATCH /segnalazioni/{id}/stato` con
   `{ "statoId": 2 }` (Preso in carico) → 200
4. Ripeti con `{ "statoId": 5 }` (Risolto) direttamente → **400**: la transizione non è ammessa
5. `GET /segnalazioni/{id}` → vedi lo `storicoStati` e le `transizioniAmmesse`
6. Su Supabase (Table Editor) controlla le righe in `storico_stato` e `log_audit`

### Altri modi per provare

- **Postman / Insomnia**: importa `http://localhost:3000/api/openapi.json` e ottieni tutte le
  richieste già pronte.
- **VS Code**: il file `requests.http` contiene richieste pronte (estensione *REST Client*).
- **Browser**: le GET si aprono direttamente, es. http://localhost:3000/api/stati.
- **Prisma Studio**: `npm run db:studio` apre un'interfaccia per vedere e modificare i dati.

---

## 4. Aggiungere un nuovo endpoint

Esempio: `POST /api/segnalazioni/{id}/assegnazioni`.

1. **Validazione**: aggiungi lo schema zod in `src/server/validation/`
2. **Service**: scrivi la funzione in `src/server/services/` (query, regole, transazione, audit)
3. **Route**: crea `src/app/api/segnalazioni/[id]/assegnazioni/route.ts`, avvolta in `route(...)`
4. **Documentazione**: aggiungi il path in `src/server/openapi.ts` così compare in Swagger UI
5. `npm run typecheck` e prova da `/api/docs`

---

## 5. Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | avvia il server di sviluppo |
| `npm run build` | build di produzione |
| `npm run typecheck` | controlla i tipi TypeScript |
| `npm run lint` | controlla lo stile del codice |
| `npm run db:pull` | rilegge le tabelle da Supabase e rigenera il client (dopo modifiche al DB) |
| `npm run db:seed` | inserisce i dati demo |
| `npm run db:studio` | interfaccia grafica sui dati |

## 6. Cose da sapere

- **Vincoli CHECK**: il DB ha vincoli che Prisma non vede, per esempio `luogo.tipo` deve essere
  edificio/area/impianto e `tecnico.tipo` interno/esterno. Se una scrittura li viola, la
  risposta è un 500 generico. Conviene replicarli negli schemi zod.
- **RLS**: le tabelle hanno la Row Level Security attiva, ma il backend si collega come utente
  `postgres`, che la ignora. I permessi li gestisce il backend (`requireRole`).
- **Macchina a stati**: le transizioni ammesse sono in `TRANSIZIONI`
  (`segnalazioni.service.ts`). Per cambiare il workflow si modifica solo quella mappa.
