# API — [Nome progetto]

| | |
|---|---|
| **Progetto** | *nome del progetto/cliente* |
| **Team** | *nome o numero team* |
| **Data** | *data di questa versione* |
| **Versione** | *es. v0.1 — solo gli endpoint del laboratorio di oggi* |

*Documentate qui solo gli endpoint che esistono davvero e rispondono. Un
endpoint non documentato non esiste, per chi deve integrarlo — ma un endpoint
documentato e non funzionante è peggio: cancellatelo o segnalatelo come non
pronto.*

## Convenzioni generali

*Descrivete in 3-4 righe cosa vale per tutta l'API: formato dei dati, base
path, come sono strutturati gli errori. Non ripetetelo per ogni endpoint.*

Esempio (Smart Maintenance):

> Tutte le risposte sono JSON. Gli errori hanno sempre la forma
> `{ "errore": "descrizione leggibile" }` insieme allo status code corretto —
> mai un `200 OK` con l'esito scritto nel corpo. Le liste sono paginate con
> `page` e `pageSize` in query string.

## Endpoint

*Un blocco per ciascun endpoint documentato oggi (3-4, non tutta l'API).
Copiate il blocco sotto per ognuno.*

### `GET /interventi/{id}`

*Descrizione in una riga: cosa fa, per chi.*

Esempio: recupera il dettaglio di un intervento esistente.

**Parametri**

| Nome | In | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|---|
| `id` | path | intero | sì | identificativo dell'intervento |

**Risposte**

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `200 OK` | l'intervento esiste | `{ "id": 42, "edificio": "Sede Nord", "stato": "assegnato" }` |
| `404 Not Found` | nessun intervento con questo id | `{ "errore": "intervento non trovato" }` |

### `POST /interventi`

*Descrizione in una riga.*

Esempio: crea un nuovo intervento a partire da una segnalazione.

**Corpo della richiesta**

```json
{ "edificio": "sede-nord", "categoria": "elettrico", "descrizione": "..." }
```

**Risposte**

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `201 Created` | dati validi | `{ "id": 43, "stato": "segnalato" }` |
| `400 Bad Request` | campo obbligatorio mancante (es. `edificio`) | `{ "errore": "campo edificio obbligatorio" }` |

*(Aggiungete qui gli altri 1-2 endpoint del laboratorio, con la stessa
struttura: parametri o corpo richiesta, e ogni risposta possibile — successo
ed errori — non solo quella positiva.)*

## Test collegati

*Per ciascun endpoint sopra, indicate dove sono i test che lo verificano
(cartella `tests/`) e quali casi coprono. Non serve incollare il codice qui,
basta il collegamento.*

Esempio:

> `GET /interventi/{id}` → `tests/test_interventi.py::test_get_esistente`,
> `tests/test_interventi.py::test_get_inesistente`
