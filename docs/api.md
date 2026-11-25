# Contratto API — Smart Maintenance

Il contratto ufficiale dell'API è la specifica OpenAPI generata dal backend:

- JSON: [`/api/openapi.json`](../web/src/app/api/openapi.json/route.ts)
- Swagger UI: `http://localhost:3000/api/docs`
- Sorgente: [`web/src/server/openapi.ts`](../web/src/server/openapi.ts)

La specifica è OpenAPI 3.1 e viene servita direttamente dall'applicazione,
così schema Zod, validazione e documentazione restano allineati. Tutte le
risposte sono JSON. Gli errori hanno la forma
`{ "error": { "code": "...", "message": "...", "details": ... } }`.
Tutti gli endpoint, tranne `GET /api/health` e `POST /api/auth/login`,
richiedono l'header `Authorization: Bearer <token>`, con il token restituito
dal login. Ogni risposta porta un header `x-request-id`, lo stesso che compare
nei log del server.

## Endpoint disponibili

| Metodo e percorso | Scopo | Chi | Risposte principali |
|---|---|---|---|
| `GET /api/health` | Verifica applicazione e database | pubblico | `200`, `503` |
| `POST /api/auth/login` | Email + password → token | pubblico | `200`, `400`, `401`, `429` |
| `GET /api/auth/me` | Utente del token, con ruoli | autenticato | `200`, `401` |
| `GET /api/categorie` | Elenca le categorie attive | autenticato | `200`, `401` |
| `GET /api/priorita` | Elenca le priorità | autenticato | `200`, `401` |
| `GET /api/stati` | Elenca gli stati del workflow | autenticato | `200`, `401` |
| `GET /api/luoghi` | Elenca edifici, aree e impianti | autenticato | `200`, `401` |
| `GET /api/tecnici` | Tecnici attivi (per assegnare) | Responsabile, Amministratore | `200`, `401`, `403` |
| `GET /api/segnalazioni` | Cerca e pagina le segnalazioni **visibili all'utente** | autenticato | `200`, `400`, `401` |
| `POST /api/segnalazioni` | Crea una segnalazione nello stato `Segnalato` | Segnalatore, Responsabile, Amministratore | `201`, `400`, `401`, `403` |
| `GET /api/segnalazioni/{id}` | Dettaglio, storico e transizioni ammesse | chi la può vedere | `200`, `400`, `401`, `404` |
| `PATCH /api/segnalazioni/{id}/stato` | Esegue una transizione ammessa | Responsabile, Amministratore, Tecnico **assegnato** | `200`, `400`, `401`, `403`, `404`, `409` |
| `POST /api/segnalazioni/{id}/assegnazioni` | Assegna uno o più tecnici | Responsabile, Amministratore | `201`, `400`, `401`, `403`, `404`, `409` |

**Visibilità.** Responsabile e Amministratore vedono tutte le segnalazioni. Il
Tecnico vede quelle assegnate a lui, il Segnalatore quelle che ha creato. Una
segnalazione fuori da questo perimetro risponde `404`, come se non esistesse.
Le risposte non contengono le email degli altri utenti.

## Dettagli operativi

`GET /api/segnalazioni` accetta i filtri `statoId`, `categoriaId`,
`luogoId`, `tecnicoId`, `dal`, `al`, `q`, `page` e `pageSize`, e restituisce
`{ items, total, page, pageSize }`. `al=2026-10-01` include tutto il 1 ottobre
(UTC), vedi `docs/bug-report-43.md`. I filtri si combinano con la visibilità e
non possono allargarla.

`POST /api/segnalazioni` accetta `titolo`, `descrizione`, `luogoId`,
`categoriaId` e `prioritaPropostaId`:

```json
{
  "titolo": "Condizionatore rumoroso",
  "descrizione": "Rumore all'accensione",
  "luogoId": 1,
  "categoriaId": 3,
  "prioritaPropostaId": 2
}
```

`POST /api/auth/login` accetta `{ "email", "password" }` e restituisce
`{ token, tokenType: "Bearer", expiresIn, utente }`.

`POST /api/segnalazioni/{id}/assegnazioni` accetta `{ "tecnicoIds": [2, 5] }`.
Scrive una riga `ASSEGNAZIONE` in `log_audit` per ogni tecnico, nella stessa
transazione. Se un tecnico è già assegnato risponde `409`; se la segnalazione è
già risolta risponde `400`.

`PATCH /api/segnalazioni/{id}/stato` accetta `statoId` e il `motivo` opzionale.
Il workflow è `Segnalato → Preso in carico → In lavorazione →
Sospeso/Risolto`; da `Sospeso` è ammesso il ritorno a `In lavorazione`.

## Verifica

Il contratto può essere provato da Swagger UI (solo in sviluppo) o con
`web/requests.http` (estensione REST Client), che fa il login e riusa il token.
La suite automatica è in `web/tests/`: `cd web && npm test` esegue i test
unitari e quelli di integrazione su un PostgreSQL temporaneo. Gli esiti sono
registrati in [`docs/test-plan.md`](test-plan.md).
