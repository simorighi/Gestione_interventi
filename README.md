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

per ora si esegue con **npm run dev** ma non c'è ancora interfaccia, solo swagger

## Struttura del repository

```
Gestione_interventi/
├── README.md                     questo file (traccia del laboratorio)
├── docs/                         documentazione di progetto
│   ├── SmartMaintenance.md       richiesta del cliente
│   ├── requirements.md           requisiti funzionali e non funzionali
│   ├── use-cases.md              attori e casi d'uso
│   ├── architecture-v1.md        componenti, responsabilità, diagramma
│   ├── data-model.md             modello dei dati
│   ├── backlog.md                backlog iniziale
│   └── domande-cliente.md        domande aperte per il cliente
└── web/                          backend (Next.js + Prisma + PostgreSQL)
    ├── package.json
    ├── next.config.ts
    ├── prisma.config.ts
    ├── requests.http             richieste di prova (REST Client)
    ├── prisma/
    │   ├── schema.prisma         schema del database
    │   └── seed.ts               dati di esempio (npm run db:seed)
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── api/              route handler REST
        │       ├── health/       stato app e DB
        │       ├── docs/         Swagger UI
        │       ├── openapi.json/ specifica OpenAPI
        │       ├── segnalazioni/ elenco, dettaglio, [id]/stato
        │       ├── stati/        anagrafica stati
        │       ├── categorie/    anagrafica categorie
        │       ├── priorita/     anagrafica priorità
        │       └── luoghi/       anagrafica luoghi
        └── server/               logica lato server
            ├── auth.ts           identificazione utente
            ├── db.ts             client Prisma
            ├── errors.ts         errori applicativi
            ├── http.ts           helper di risposta HTTP
            ├── openapi.ts        definizione OpenAPI
            ├── services/         logica di business
            └── validation/       schemi zod
```

*Aggiornate l'albero quando aggiungete cartelle vere (es. `src/`, `tests/`):
questo file deve restare uno specchio fedele di cosa c'è nel repository.*

## Stato del progetto

Creato un backend inziale con un swagger che permette di connettersi al database e fare delle chiamate.

