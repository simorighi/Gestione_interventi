# Requisiti — Smart Maintenance / NordFacility S.r.l.

| | |
|---|---|
| **Team** | Raul Zamperini, Simone Righi, Nathan Seganti, Manuel Boscaini, Nicola Cortinovis  |
| **Cliente** | *NordFacility S.r.l.* |
| **Data** | 23/09/2026 |
| **Versione** | v1 |

## Problema

*Le richieste di intervento non si riesce a capire che in che stato sono, visto che sono gestite con messaggi, e-mail o telefono. I Tecnici non riescono ad aggiornare gli interventi e rende difficile capire quali problemi siano ancora aperti, chi li gestisce e cosa è già stato fatto sullo stesso impianto.*

## Obiettivi del progetto

* Centralizzare tutte le segnalazioni di guasto o anomalia.
* Ridurre i tempi di presa in carico e migliorare la visibilità sullo stato degli interventi.
* Disporre di uno storico consultabile per edificio, area o impianto.
* Consentire ai tecnici di aggiornare gli interventi direttamente durante l'attività.
* Fornire al responsabile manutenzione una vista sintetica delle attività aperte e concluse.

## Requisiti funzionali
### Funzionalità richieste:

 1. Creazione di una segnalazione con luogo, categoria, descrizione, priorità proposta e fotografie.
 2. Assegnazione della segnalazione a uno o più tecnici.
 3. Gestione di un ciclo di stato almeno composto da: *segnalato*, *preso in carico*, *in lavorazione*, *sospeso*, *risolto*.
 4. Inserimento di note tecniche e descrizione dell'intervento effettuato
 5. Ricerca e filtraggio per stato, edificio, categoria, tecnico e periodo.
 6. Consultazione dello storico degli interventi relativi a uno stesso edificio o impianto.
 7. Dashboard sintetica con numero di interventi aperti, in lavorazione e conclusi.  

## Requisiti non funzionali

* Interfaccia utilizzabile da browser su PC e tablet.
* Rendere la maggior parte di configurazioni modificabili senza intervenire sul codice sorgente.
* Separazione chiara tra componenti applicativi e persistenza dei dati.
* Gestione coerente degli errori e restituzione di messaggi comprensibili agli utenti.
* Predisposizione a future evoluzioni del workflow e delle categorie di intervento.

## Vincoli dichiarati dal cliente

* Non è richiesta l'integrazione con impianti fisici reali.
* La soluzione deve poter essere eseguita in un ambiente controllato dal cliente.
* Il cliente non impone uno specifico stack tecnologico.
* Il progetto deve poter essere dimostrato utilizzando un set di dati di prova realistico.

## Glossario


