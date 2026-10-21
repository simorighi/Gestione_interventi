# CONTRIBUTING

| | |
|---|---|
| **Progetto** | *NordFacility Platform* |
| **Team** | *Team Sviluppo NordFacility* |
| **Data** | *21 Ottobre 2026* |
| **Versione** | *v0.1 — riscrivetela quando le regole cambiano davvero* |

Queste regole valgono per **tutti** i membri del team, comprese le persone
che le hanno scritte. Se una regola non viene rispettata da nessuno, cambiatela
qui — non ignoratela in silenzio.

## Branch strategy

Il branch `main` deve essere sempre funzionante e compilabile. Nessuno può fare commit diretti su `main`. Tutte le modifiche passano tramite branch separati e successiva Pull Request (PR).

Utilizziamo i seguenti prefissi per nominare i nostri branch:

```text
main                 sempre funzionante, nessun commit diretto
feature/<cosa>       nuova funzionalità o task
fix/<cosa>           correzione di un bug
docs/<cosa>          modifiche esclusive alla documentazione
refactor/<cosa>      modifiche al codice che non alterano le funzionalità (es. pulizia)
```

> **Esempi validi per NordFacility:** `feature/filtro-interventi-tecnico`, `fix/calcolo-priorita-ticket`, `docs/api-storage-documenti`, `refactor/ottimizzazione-query-edifici`.

*Un branch vive il tempo di un'attività: nasce da `main` (assicurati di avere la versione più aggiornata prima di crearlo), si sviluppa, si integra con una PR, e **si elimina** dopo il merge. Non deve durare settimane.*

## Convenzioni di commit

Utilizziamo le direttive dei *Conventional Commits*. Il formato del messaggio è: prefisso + descrizione al presente imperativo, che dice il "cosa", non il "come" (il come si legge nel diff del codice).

```text
feat: <cosa aggiunge>
fix: <cosa corregge>
docs: <cosa documenta>
style: <formattazione, spazi, ecc. senza impatti sul codice>
refactor: <ristrutturazione codice>
test: <aggiunta o modifica di test>
```

> **Esempi validi:** `feat: aggiungi mappa interattiva degli stabili`, `fix: risolvi crash nell'inserimento del rapportino`, `docs: aggiorna readme con istruzioni di setup locale`.

*Evitate messaggi come "wip", "fix veloce", "modifiche varie": chi legge la storia in futuro — anche voi, tra un mese — deve capire immediatamente perché quel commit esiste senza dover per forza leggere il codice.*

## Pull/merge request e review

Per mantenere alta la qualità del codice di NordFacility, seguiamo queste regole verificabili:

- **Chi può fare merge su `main`?** L'autore della PR è responsabile di cliccare "Merge", ma solo *dopo* aver ottenuto l'approvazione necessaria e che la pipeline CI (se presente) sia verde.
- **Quante approvazioni servono prima del merge?** Almeno **1 approvazione** da un membro del team che non ha scritto il codice.
- **Cosa NON è accettabile in una review?**
  - Approvare scrivendo solo "LGTM" (Looks Good To Me) senza aver effettivamente letto il diff o provato la funzionalità.
  - Lasciare commenti offensivi o non costruttivi (es. "questo codice fa schifo" invece di "penso che potremmo ottimizzare questo ciclo usando un map").
  - Bloccare una PR per preferenze personali di stile se non sono normate da un linter automatico o da questo documento.

## Gestione dei conflitti

I conflitti sono normali, ma vanno gestiti con cura per non sovrascrivere il lavoro dei colleghi.

- Chi apre la PR è responsabile di aggiornare il proprio branch con `main` e risolvere eventuali conflitti.
- **Regola di salvaguardia:** se un conflitto è troppo esteso, non è chiaro quale codice mantenere, o non si risolve in 10-15 minuti, **non forzare una scelta da soli**. Chiama in una call veloce (o fissa un momento di pair programming) il membro del team che ha scritto le modifiche in conflitto per risolverlo insieme.

## Definition of Done (DoD)

Una issue su NordFacility non è finita quando "il codice funziona sul mio PC". Una issue è considerata **Fatta (Done)** esclusivamente quando:

1. Il codice è stato revisionato, approvato e mergiato su `main`.
2. I criteri di accettazione (Acceptance Criteria) descritti nella issue sono stati tutti soddisfatti.
3. Esiste un modo chiaro per testare/verificare la feature (test automatici o istruzioni per test manuali fornite nella PR).
4. Nessun "segreto" (password, token API reali, chiavi DB) o dato di test sensibile è rimasto hardcoded nel codice.
5. La issue collegata sulla board è stata spostata nell'ultima colonna.

## Issue e board

Le nostre issue vivono sulla board di progetto designata. Ogni branch e PR dovrebbe essere collegato a una issue specifica. Gli stati della nostra board riflettono il flusso di lavoro:

```text
Da fare (To Do) → In corso (In Progress) → In revisione (In Review / PR Aperta) → Fatto (Done)
```

- **Da fare:** Task pronti per essere assegnati.
- **In corso:** Qualcuno ci sta lavorando attivamente (il branch esiste).
- **In revisione:** Lo sviluppo è concluso ed è aperta una Pull Request.
- **Fatto:** Rispetta la Definition of Done.
