# Architettura v1 — Smart Maintenance / NordFacility

| | |
|---|---|
| **Team** | Team Sviluppo NordFacility (SimoRighi, manuel, nat, nicola, rzamp) |
| **Cliente** | NordFacility S.r.l. |
| **Data** | 21/10/2026 |
| **Versione** | v1 — provvisoria per definizione, la confronterete con la v2 a dicembre |

## Componenti

| Componente | Risponde di | Non risponde di |
|---|---|---|
| **API Backend (Next.js)** | Ricezione richieste, validazione input, gestione della logica di business, gestione transizioni di stato (con storico e log in transazione unica). | Memorizzazione permanente dei dati, visualizzazione dell'interfaccia utente. |
| **Database (PostgreSQL via Prisma)** | Persistenza sicura e strutturata dei dati (entità, storico, audit log), garanzia dell'integrità referenziale. | Esposizione dei dati sul web, logica applicativa, autenticazione utenti. |
| **Client Frontend (React/Next.js)** | *Attualmente assente/in fase embrionale.* Risponderà della visualizzazione dei dati e dell'interazione con l'utente. | Logica di business, accesso diretto al database. |

## Diagramma

```mermaid
flowchart LR
  Utente -->|HTTP/JSON (x-user-id header provvisorio)| Backend
  Backend[API Backend - Next.js] -->|TCP/IP - Prisma| DB[(Database PostgreSQL)]
  Backend -.->|Generazione| Swagger[Documentazione OpenAPI]
```

## Dipendenze

| Componente | Dipende da | Se si ferma |
|---|---|---|
| **API Backend** | Database PostgreSQL | Le richieste falliscono in fase di salvataggio/lettura, restituendo errori 500 (gestiti in un punto unico). Impossibile modificare lo stato delle segnalazioni. |
| **Client Frontend** | API Backend | L'interfaccia non può caricare o inviare dati. |

## Fuori dal perimetro

- Autenticazione reale e sicura degli utenti (attualmente simulata tramite header `x-user-id`).
- Sistema di notifiche push o via email ai tecnici per le nuove assegnazioni.
- App mobile nativa (l'accesso avverrà via web).