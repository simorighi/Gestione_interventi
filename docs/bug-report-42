# Bug report — 42[cite: 31]

| Progetto | Team / cliente | Data | Versione | Autore |[cite: 31]
|---|---|---|---|---|
| Smart Maintenance | Simo, Nat, Nicola, Rzamp, Manuel / NordFacility S.r.l. | 11/11/2026 | v0.1 | Manuel Boscaini |

## Sintomo[cite: 31]

Il tecnico B vede nella sua lista anche l'intervento assegnato al tecnico A.[cite: 31]

## Passi per riprodurre[cite: 31]

1. Login nell'applicativo come tecnico B (es. id utente 2).[cite: 31]
2. Esecuzione di una `GET /api/interventi`.[cite: 31]
3. L'intervento #42 (che su database è assegnato al tecnico A) è presente nella lista restituita.[cite: 31]

## Causa[cite: 31]

Il controller dell'API (`app/api/interventi/route.ts`) chiama `prisma.intervento.findMany()` senza filtrare per `tecnicoId`: restituisce l'intera tabella interventi, indipendentemente dall'id di chi ha fatto la richiesta.[cite: 31]

## Correzione[cite: 31]

Aggiunto il filtro `where: { tecnicoId: user.id }` nella query Prisma + test di regressione `test_lista_filtrata_per_tecnico`.[cite: 31]

## Test aggiunto[cite: 31]

| Test | Percorso | Verifica |[cite: 31]
|---|---|---|
| *test_lista_filtrata_per_tecnico* | *tests/integration/api_interventi.test.ts* | *un tecnico vede solo i propri interventi* |

## Verifica di regressione[cite: 31]

Suite completa eseguita l'11/11: tutti i test passano, incluso quello nuovo aggiunto per bloccare questo specifico bug.[cite: 31]
