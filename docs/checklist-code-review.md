# Checklist di code review — Fix visibilità segnalazioni (bug 42)

| Progetto | Team revisionato | Team revisore | Data | Pull request |
|---|---|---|---|---|
| Smart Maintenance | Team 1 | *(da compilare: nome del revisore dell'altro team)* | *(data della review)* | *(numero della PR su GitHub)* |

> **Perché questa checklist è stata riaperta.** La versione dell'11/11 approvava
> "così com'è" una correzione che citava file e test inesistenti
> (`tests/integration/api_interventi.test.ts`), e affermava che il test
> "fallisce rimuovendo il `where`". Nessuno l'aveva eseguito. Una review che
> approva senza aprire i file non è una review. Le voci qui sotto vanno
> ricompilate dal **revisore dell'altro team**, sul codice reale. Per ogni voce
> c'è il punto da controllare.

Codice da revisionare: commit `Protegge letture, filtra per ruolo` e
`Limita cambio stato ai tecnici assegnati` (vedi `docs/bug-report-42.md`).

## Correttezza

- [ ] Sì / No — *riferimento:* `filtroVisibilita()` in
  `web/src/server/services/segnalazioni.service.ts` copre tutti i ruoli?
  Cosa succede a un utente con **due** ruoli (es. Tecnico + Segnalatore)? E a
  uno senza ruoli? Confrontare con `docs/test-plan.md`, righe 3 e 7.

## Leggibilità

- [ ] Sì / No — *riferimento:* si capisce dalla sola lettura di
  `listSegnalazioni` e `getSegnalazione` perché un filtro dell'utente non può
  allargare la visibilità (`AND` tra filtri e visibilità)?

## Test

- [ ] Sì / No — *riferimento:* `web/tests/integration/visibilita.test.ts`.
  Prova da fare: togliere `visibilita` dalla `where` di `listSegnalazioni`,
  lanciare `npm run test:integration` e annotare quali test falliscono. Poi
  ripristinare.

## Impatto

- [ ] Sì / No — *riferimento:* la vista del Responsabile/Amministratore
  (test `responsabile e amministratore vedono tutto`) e il frontend
  (`Dashboard.tsx`, `ListaSegnalazioni.tsx`): un tecnico senza assegnazioni
  vede una lista vuota, e non un errore?

## Esito

- [ ] Approvata così com'è
- [ ] Approvata con commenti minori (non bloccanti)
- [ ] Richieste modifiche — non si può chiudere senza rivederla

## Commenti

*(da compilare dal revisore)*
