# Contratto API — Smart Maintenance

Il contratto ufficiale dell'API è la specifica OpenAPI generata dal backend:

- JSON: [`/api/openapi.json`](../web/src/app/api/openapi.json/route.ts)
- Swagger UI: `http://localhost:3000/api/docs`
- Sorgente: [`web/src/server/openapi.ts`](../web/src/server/openapi.ts)

La specifica è OpenAPI 3.1 e viene servita direttamente dall'applicazione,
così schema Zod, validazione e documentazione restano allineati. Tutte le
risposte sono JSON. Gli errori hanno la forma
`{ "error": { "code": "...", "message": "...", "details": ... } }`.
Le operazioni di scrittura richiedono l'header provvisorio `x-user-id`.

## Endpoint disponibili

| Metodo e percorso | Scopo | Risposte principali |
|---|---|---|
| `GET /api/health` | Verifica applicazione e database | `200`, `503` |
| `GET /api/categorie` | Elenca le categorie attive | `200` |
| `GET /api/priorita` | Elenca le priorità | `200` |
| `GET /api/stati` | Elenca gli stati del workflow | `200` |
| `GET /api/luoghi` | Elenca edifici, aree e impianti | `200` |
| `GET /api/segnalazioni` | Cerca e pagina le segnalazioni | `200`, `400` |
| `POST /api/segnalazioni` | Crea una segnalazione nello stato `Segnalato` | `201`, `400`, `401`, `403` |
| `GET /api/segnalazioni/{id}` | Recupera dettaglio e storico | `200`, `400`, `404` |
| `PATCH /api/segnalazioni/{id}/stato` | Esegue una transizione ammessa | `200`, `400`, `401`, `403`, `404`, `409` |

## Dettagli operativi

`GET /api/segnalazioni` accetta i filtri `statoId`, `categoriaId`,
`luogoId`, `tecnicoId`, `dal`, `al`, `q`, `page` e `pageSize`, e restituisce
`{ items, total, page, pageSize }`.

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

`PATCH /api/segnalazioni/{id}/stato` accetta `statoId` e il `motivo` opzionale.
Il workflow è `Segnalato → Preso in carico → In lavorazione →
Sospeso/Risolto`; da `Sospeso` è ammesso il ritorno a `In lavorazione`.

## Verifica

Il contratto può essere provato da Swagger UI. Per verifiche ripetibili,
importare `/api/openapi.json` in Postman/Insomnia oppure usare
`web/requests.http` con l'estensione REST Client. La suite automatica non è
presente nel repository; gli esiti delle verifiche manuali vanno registrati
in [`docs/test-plan.md`](test-plan.md).
