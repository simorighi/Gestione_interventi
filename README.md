# CREARE BRANCH PER OGNI ATTIVITA AGGIORNATO DAL MAIN E DOPO ELIMINARLO 
 Lezione 1: Dall'applicazione all'architettura software
# SMART MANTAINANCE

| | |
|---|---|
| **Cliente** | NordFacility S.r.l. |
| **Team** | *1* |
| **Membri** | *Un nome per riga, con il ruolo se già definito* |
| **Data** | *21/10/2026* |
| **Versione** | *v0.1 — aumenta quando il contenuto cambia in modo sostanziale* |

## Cosa fa questo progetto

 applicazione per centralizzare le
segnalazioni di guasto sugli edifici gestiti, assegnare gli interventi ai
 tecnici e seguirne lo stato dall'apertura alla chiusura.

## Stack

*Dichiarate qui, in una riga per componente, cosa avete scelto — non è
imposto dal corso, ma va detto esplicitamente perché chi clona il repository
sappia cosa aspettarsi.*

```
Stack: <Node.js + Prisma>
Frontend: <react + vite>
Database: <Supabase (PostgreSQL)>
```


## Come si esegue

Servono Node.js 22+ e npm. Due terminali:

```bash
# 1) backend (API) su http://localhost:3000
cd web
npm install
cp .env.example .env        # DATABASE_URL + AUTH_SECRET (openssl rand -base64 48)
npm run dev

# 2) frontend su http://localhost:5173 (le chiamate /api vanno al backend tramite il proxy di Vite)
cd frontend/frontendGestione
npm install
npm run dev
```

Senza Supabase: `npm run db:locale` in `web/` avvia un PostgreSQL locale (vedi `web/README.md`).
Utenti demo dopo `npm run db:seed`: `segnalatore@demo.it`, `tecnico@demo.it`,
`responsabile@demo.it`, `admin@demo.it`, password `password`.

| Cosa | Comando (in `web/`) |
|---|---|
| Test unitari + integrazione | `npm test` |
| Controllo tipi / stile | `npm run typecheck` · `npm run lint` |
| Vulnerabilità dipendenze | `npm run audit` |
| Documentazione API | http://localhost:3000/api/docs |
| Deploy su MicroK8s | `k8s/passaggi.md`, rilascio e rollback in `k8s/rilascio-rollback.md` |

## Struttura del repository

```
Gestione_interventi/
├── README.md                     questo file
├── config/                       template di configurazione per ambiente (dev.env, test.env)
├── docs/                         documentazione di progetto
│   ├── SmartMaintenance.md       richiesta del cliente
│   ├── requirements.md           requisiti funzionali e non funzionali
│   ├── use-cases.md              attori e casi d'uso
│   ├── architecture-v1.md        componenti, diagramma, confini di fiducia
│   ├── data-model.md             modello dei dati
│   ├── backlog.md                backlog
│   ├── api.md                    contratto API
│   ├── configuration.md          variabili d'ambiente e secret
│   ├── test-plan.md              matrice requisito → test → esito
│   ├── bug-report-42.md, -43.md  difetti riprodotti e corretti
│   ├── checklist-code-review.md  checklist della review incrociata
│   ├── feature-ai.md             lab 7: feature sviluppata con assistente AI
│   ├── security-review.md        lab 10: checklist e criticità di sicurezza
│   └── domande-cliente.md        domande aperte per il cliente
├── k8s/                          manifest Kubernetes (Deployment, Service, Ingress TLS, ...)
├── frontend/frontendGestione/    SPA React + Vite (login, dashboard, segnalazioni)
│   ├── Dockerfile, nginx.conf    immagine nginx non root
│   └── src/
│       ├── services/api.ts       client dell'API (token Bearer)
│       ├── contexts/             AuthContext (login/logout)
│       └── pages/                Login, Dashboard, Lista, Dettaglio, Nuova segnalazione, ...
└── web/                          backend (Next.js + Prisma + PostgreSQL)
    ├── Dockerfile                immagine di produzione (next build, standalone)
    ├── requests.http             richieste di prova (REST Client)
    ├── prisma/
    │   ├── schema.prisma         schema del database
    │   ├── seed.ts, riferimento.ts  dati demo e di riferimento
    │   └── sql/                  trigger audit immutabile, utente DB limitato
    ├── scripts/db-locale.ts      PostgreSQL locale di sviluppo
    ├── tests/                    unit/ e integration/ (Vitest + PostgreSQL embedded)
    └── src/
        ├── instrumentation.ts    validazione della configurazione all'avvio
        ├── proxy.ts              CORS e header di sicurezza
        ├── app/api/              route handler REST (auth, segnalazioni, assegnazioni, anagrafiche, ...)
        └── server/               config, auth, token, log, workflow, services, validation
```

## Stato del progetto

| Area | Stato |
|---|---|
| Autenticazione | Login email + password, token firmato con scadenza |
| Permessi | Per ruolo e per assegnazione, applicati nelle query |
| Segnalazioni | Creazione, lista con filtri, dettaglio, cambio stato col workflow, assegnazione tecnici, storico e audit |
| Frontend | Login, dashboard, lista, dettaglio e nuova segnalazione collegati all'API. Tecnici, Edifici e Impostazioni usano ancora dati di esempio (`src/data/mockData.ts`) |
| Test | 108 test automatici (`web/`, `npm test`) |
| Deploy | Immagini di produzione, MicroK8s con Ingress HTTPS |
| Da fare (backlog) | Suggerimento AI (voce 2), allegati e note tecniche (voci 3 e 6), vista audit per il Responsabile (voce 5) |
