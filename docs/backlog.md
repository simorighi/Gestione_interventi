# Backlog iniziale — [Nome progetto] / [Cliente]

| | |
|---|---|
| **Team** | *(nome team, componenti)* |
| **Cliente** | *(es. NordFacility S.r.l.)* |
| **Data** | 23/09/2026 |

*8-10 voci, ordinate per valore e rischio: prima le cose che fanno paura,
perché sono quelle che possono far cambiare l'architettura. Ogni voce deve
avere un "Fatto quando" verificabile — se non sapete come si verifica, la
voce non è pronta.*

## Formato

```
Come <attore> voglio <azione> per <beneficio>

Fatto quando:
- ...
- ...
```

> **Esempio**
> Come tecnico voglio vedere solo gli interventi assegnati a me, per non
> perdere tempo tra le segnalazioni altrui.
> **Fatto quando:** la lista mostra solo i miei interventi · un tecnico non
> vede quelli di un collega nemmeno chiamando l'API a mano · la lista è
> ordinata per priorità.


## Voci

### 1. Setup Architettura, DB e Configurazione Esterna (Rischio Alto: Deploy e Sicurezza)
Come Amministratore di sistema voglio che l'applicazione legga le configurazioni (connessione DB, secret, parametri AI) da variabili d'ambiente o file esterni, per poterla deployare in ambienti diversi senza modificare il codice sorgente.

**Fatto quando:**
- l'app si avvia correttamente leggendo le config da un file `.env` o variabili d'ambiente
- non ci sono credenziali o URL hardcoded nel codice sorgente
- il database viene inizializzato automaticamente con lo schema di base (tabelle per edifici, utenti, ruoli) al primo avvio
- l'applicazione è containerizzata (es. Docker) e avviabile con un singolo comando documentato

### 2. Integrazione Modulo AI per Suggerimenti (Rischio Alto: Dipendenza Esterna / Latenza)
Come Segnalatore voglio che il sistema mi suggerisca categoria e priorità basandosi sulla mia descrizione testuale, per compilare la segnalazione in modo più accurato e veloce.

**Fatto quando:**
- all'inserimento della descrizione, il sistema interroga un servizio AI (interno o API esterna) e restituisce categoria e priorità suggerite
- l'utente vede chiaramente che si tratta di un "suggerimento" e può accettare o modificare i valori prima di inviare
- se il servizio AI fallisce, è lento (> 3 sec) o non risponde, il sistema permette di procedere con valori di default (fallback) senza bloccare l'operatore (human-in-the-loop)

### 3. Creazione Segnalazione e Gestione Allegati (Valore: Entry Point del business)
Come Segnalatore voglio creare una segnalazione di guasto allegando foto e indicando l'impianto, per far sapere al team tecnico cosa è rotto e dove.

**Fatto quando:**
- posso selezionare edificio, area e impianto da anagrafiche precaricate nel sistema
- posso caricare e salvare almeno una foto/documento associato alla segnalazione
- la segnalazione viene salvata nel DB con stato iniziale "Segnalato" e i dati suggeriti dall'AI (o inseriti manualmente)
- il sistema restituisce un messaggio di successo comprensibile all'utente

### 4. Assegnazione e Ciclo di Vita (Valore: Core Workflow)
Come Responsabile Manutenzione voglio assegnare una segnalazione a uno o più tecnici e farla transitare tra gli stati previsti, per indirizzare il lavoro e tenere traccia del flusso.

**Fatto quando:**
- posso selezionare uno o più tecnici per una segnalazione con stato "Segnalato"
- posso far transitare lo stato della segnalazione rispettando la macchina a stati: Segnalato -> Preso in carico -> In lavorazione -> Sospeso/Risolto
- ogni cambio di stato è salvato in modo persistente e l'interfaccia si aggiorna correttamente

### 5. Tracciabilità e Audit Log (Rischio Medio: Compliance e Requisito di Controllo)
Come Responsabile (o Amministratore) voglio che ogni assegnazione e cambio di stato venga registrato in un log di audit, per poter ricostruire la storia esatta di chi ha fatto cosa e quando.

**Fatto quando:**
- ogni transizione di stato o assegnazione crea una riga di log immutabile con: timestamp, utente che ha fatto l'azione, stato precedente, stato successivo
- i log di audit sono consultabili dal Responsabile tramite un'apposita vista o sezione
- le operazioni di cambio stato sono protette da RBAC (solo ruoli autorizzati possono eseguirle)

### 6. Esecuzione Intervento e Note Tecniche (Valore: Flusso del Tecnico)
Come Tecnico voglio visualizzare solo i miei interventi assegnati e inserire note tecniche e foto a fine lavoro, per chiudere la segnalazione e lasciare traccia dell'attività svolta.

**Fatto quando:**
- la lista interventi del tecnico mostra *solo* quelli assegnati a lui (il filtraggio avviene a livello di API/DB, non solo di UI)
- posso aggiungere note testuali e caricare allegati (es. foto del lavoro finito)
- posso portare la segnalazione allo stato "Risolto", chiudendo di fatto il ciclo di vita

### 7. Ricerca, Filtri e Storico Impianto (Valore: Knowledge Reuse)
Come Utente (Tecnico/Responsabile) voglio cercare le segnalazioni e vedere lo storico di uno specifico impianto, per capire se un guasto è ricorrente o già risolto in passato.

**Fatto quando:**
- esiste una pagina di ricerca con filtri funzionanti per: stato, edificio, categoria, tecnico assegnato e periodo temporale
- cliccando su un impianto (o filtrando per esso) si vede la lista cronologica di tutti gli interventi passati associati a quello specifico impianto
- le query di ricerca sono ottimizzate per non degradare le prestazioni all'aumentare dei dati

### 8. Dashboard di Supervisione (Valore: Visibility per il Management)
Come Responsabile Manutenzione voglio una dashboard con i contatori degli interventi aperti, in lavorazione e conclusi, per avere subito il polso della situazione senza fare query manuali.

**Fatto quando:**
- la dashboard mostra i conteggi aggiornati degli interventi suddivisi per macro-stato
- i numeri sono calcolati in modo efficiente (es. query di aggregazione ottimizzate)
- cliccando sui contatori o sui grafici, l'utente viene portato direttamente alla lista delle segnalazioni filtrata per quello specifico stato
