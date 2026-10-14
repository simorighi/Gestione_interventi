# Smart Maintenance — backend (Next.js + Prisma + Supabase)

## Setup

1. `npm install` (genera anche il client Prisma)
2. Copia `.env.example` in `.env` e metti la stringa del **Session pooler** di Supabase
   (Connect → Session pooler, porta 5432). La connessione "Direct" è solo IPv6 e su
   molte reti non risponde. Caratteri speciali nella password vanno codificati (`@` → `%40`).
3. (opzionale) `npm run db:seed` aggiunge utenti, luoghi e segnalazioni demo
4. `npm run dev` → http://localhost:3000 (la home elenca gli endpoint)

Le tabelle si gestiscono su Supabase: `schema.prisma` è generato da lì.
Dopo una modifica alle tabelle lancia `npm run db:pull` (rilegge lo schema e rigenera il client).
**Non usare `prisma migrate`** su questo database.

Le richieste di prova sono in `requests.http`.

## Struttura

```
prisma/
  schema.prisma          modello dati, introspezionato da Supabase (db pull)
  seed.ts                dati demo (idempotente)
src/
  app/api/**/route.ts    route handler: solo HTTP (parse input → service → JSON)
  server/
    db.ts                PrismaClient singleton (adapter pg)
    http.ts              wrapper route(): errori → JSON uniforme
    errors.ts            AppError (404/400/401/403/409)
    auth.ts              utente corrente + controllo ruoli (SEGNAPOSTO)
    validation/          schemi zod per body e query
    services/            logica di business e transazioni
  generated/prisma/      client generato (non versionato)
```

Errori: `{ "error": { "code", "message", "details?" } }`.

## Da sapere

- **Autenticazione provvisoria**: l'utente corrente arriva dall'header `x-user-id`
  (vedi `src/server/auth.ts`). Va sostituita con un'autenticazione vera (es. Supabase Auth)
  prima di qualsiasi rilascio.
- Il cambio di stato segue la macchina a stati del backlog
  (Segnalato → Preso in carico → In lavorazione → Sospeso/Risolto) e scrive
  `storico_stato` e `log_audit` nella stessa transazione.
- I vincoli CHECK del DB (es. `luogo.tipo` in edificio/area/impianto, `tecnico.tipo`
  in interno/esterno) non sono visibili a Prisma: se violati la query fallisce con 500.
- Script: `db:pull`, `db:seed`, `db:studio`, `typecheck`.
