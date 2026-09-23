# Requisiti — [Nome progetto] / [Cliente]

| | |
|---|---|
| **Team** | *(nome team, componenti)* |
| **Cliente** | *(es. NordFacility S.r.l.)* |
| **Data** | 23/09/2026 |
| **Versione** | v1 |

## Problema

*In tre righe: cosa non funziona oggi per il cliente, per chi, con quale
conseguenza concreta. Non descrivete ancora una soluzione.*

> Esempio (Smart Maintenance): le richieste di intervento arrivano per
> telefono, e-mail e messaggi; non si capisce cosa è ancora aperto, chi lo
> sta gestendo e cosa è già stato fatto sullo stesso impianto.

## Obiettivi del progetto

* Centralizzare tutte le segnalazioni di guasto o anomalia.
* Ridurre i tempi di presa in carico e migliorare la visibilità sullo stato degli interventi.
* Disporre di uno storico consultabile per edificio, area o impianto.
* Consentire ai tecnici di aggiornare gli interventi direttamente durante l'attività.
* Fornire al responsabile manutenzione una vista sintetica delle attività aperte e concluse.


- Esempio: ridurre i tempi di presa in carico e migliorare la visibilità
  sullo stato degli interventi

## Requisiti funzionali
### Funzionalità richieste:

* Creazione di una segnalazione con luogo, categoria, descrizione, priorità proposta e fotografie.
* Assegnazione della segnalazione a uno o più tecnici.
* Gestione di un ciclo di stato almeno composto da: *segnalato*, *preso in carico*, *in lavorazione*, *sospeso*, *risolto*.
* Inserimento di note tecniche e descrizione dell'intervento effettuato.
* Ricerca e filtraggio per stato, edificio, categoria, tecnico e periodo.
* Consultazione dello storico degli interventi relativi a uno stesso edificio o impianto.
* Dashboard sintetica con numero di interventi aperti, in lavorazione e conclusi.  

| # | Requisito |
|---|---|
| RF1 | *Esempio: un tecnico può filtrare gli interventi per stato, edificio e periodo* |
| RF2 | |
| RF3 | |

## Requisiti non funzionali

* Interfaccia utilizzabile da browser su PC e tablet.
* Configurazioni modificabili senza intervenire sul codice sorgente.
* Separazione chiara tra componenti applicativi e persistenza dei dati.
* Gestione coerente degli errori e restituzione di messaggi comprensibili agli utenti.
* Predisposizione a future evoluzioni del workflow e delle categorie di intervento.

| # | Requisito |
|---|---|
| RNF1 | *Esempio: le categorie e le priorità si configurano senza modificare il codice* |
| RNF2 | |
| RNF3 | |

<span style="color:#888"><i>✗ "Il sistema deve essere veloce" — ✓ "La lista
degli interventi aperti compare in meno di 2 secondi con 5.000 interventi a
archivio"</i></span>

## Vincoli dichiarati dal cliente

* Non è richiesta l'integrazione con impianti fisici reali.
* La soluzione deve poter essere eseguita in un ambiente controllato dal cliente.
* Il cliente non impone uno specifico stack tecnologico.
* Il progetto deve poter essere dimostrato utilizzando un set di dati di prova realistico.

- Esempio: il cliente non impone uno specifico stack tecnologico

## Glossario

*Solo se nella richiesta cliente ci sono termini di dominio che userete spesso
e che non sono ovvi fuori da questo progetto.*

| Termine | Significato |
|---|---|
| | |
