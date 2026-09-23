# UF14 Architettura delle Applicazioni - Richiesta Cliente
## Smart Maintenance: Sistema per la gestione degli interventi tecnici

**Cliente NordFacility S.r.l.**

| Parametro | Dettaglio |
| :--- | :--- |
| **Cliente** | NordFacility S.r.l. |
| **Settore** | Facility management e manutenzione di immobili |
| **Oggetto** | Smart Maintenance - Sistema per la gestione degli interventi tecnici |
| **Destinatario** | Fornitore di servizi di analisi, progettazione e sviluppo software |
| **Corso** | UF14-Architettura delle applicazioni ed. 2025/2027 |
| **Team assegnatario** | |
| **Componenti** | |
| **Data di consegna** | |

---

### Indicazioni generali per i team

Il presente documento raccoglie cinque richieste di sviluppo software, redatte simulando reali esigenze di aziende e organizzazioni. Ogni gruppo di studenti riceverà una delle richieste e dovrà comportarsi come un team di sviluppo incaricato di analizzare il bisogno del cliente, progettare l'architettura, realizzare l'applicazione e predisporne il rilascio e la documentazione.

* La richiesta descrive il bisogno del cliente e non costituisce una specifica tecnica completa.
* Le scelte architetturali, tecnologiche e implementative devono essere motivate dal team.
* Eventuali ambiguità o requisiti mancanti devono essere individuati e trasformati in domande da porre al cliente.
* L'applicazione dovrà essere progettata in modo modulare, configurabile, testabile, sicuro e predisposto al deployment.
* L'uso di strumenti di intelligenza artificiale è ammesso nei limiti definiti durante il corso; ogni output utilizzato deve essere verificato e compreso dal team.

---

### 1. Profilo dell'azienda
NordFacility S.r.l. gestisce per conto di aziende e amministrazioni un portafoglio di circa trenta edifici tra uffici, magazzini e locali tecnici. L'azienda coordina personale interno e manutentori esterni per interventi elettrici, idraulici, di climatizzazione e manutenzione ordinaria.

### 2. Contesto e necessità
Le richieste di intervento vengono oggi raccolte tramite telefono, e-mail e messaggistica. Questo rende difficile capire quali problemi siano ancora aperti, chi li stia gestendo, quali siano le priorità e quali interventi siano già stati eseguiti sullo stesso impianto. L'azienda desidera quindi una piattaforma unica per seguire l'intero ciclo di vita di una segnalazione.

### 3. Obiettivi del progetto
* Centralizzare tutte le segnalazioni di guasto o anomalia.
* Ridurre i tempi di presa in carico e migliorare la visibilità sullo stato degli interventi.
* Disporre di uno storico consultabile per edificio, area o impianto.
* Consentire ai tecnici di aggiornare gli interventi direttamente durante l'attività.
* Fornire al responsabile manutenzione una vista sintetica delle attività aperte e concluse.

### 4. Utenti e ruoli previsti
* **Segnalatore**: apre una richiesta e ne consulta lo stato.
* **Tecnico**: visualizza gli interventi assegnati, aggiorna lo stato e inserisce note.
* **Responsabile manutenzione**: assegna interventi, modifica priorità e supervisiona il carico di lavoro.
* **Amministratore**: gestisce utenti, configurazioni e dati di base.

### 5. Funzionalità richieste
* Creazione di una segnalazione con luogo, categoria, descrizione, priorità proposta e fotografie.
* Assegnazione della segnalazione a uno o più tecnici.
* Gestione di un ciclo di stato almeno composto da: *segnalato*, *preso in carico*, *in lavorazione*, *sospeso*, *risolto*.
* Inserimento di note tecniche e descrizione dell'intervento effettuato.
* Ricerca e filtraggio per stato, edificio, categoria, tecnico e periodo.
* Consultazione dello storico degli interventi relativi a uno stesso edificio o impianto.
* Dashboard sintetica con numero di interventi aperti, in lavorazione e conclusi.

### 6. Requisiti non funzionali
* Interfaccia utilizzabile da browser su PC e tablet.
* Configurazioni modificabili senza intervenire sul codice sorgente.
* Separazione chiara tra componenti applicativi e persistenza dei dati.
* Gestione coerente degli errori e restituzione di messaggi comprensibili agli utenti.
* Predisposizione a future evoluzioni del workflow e delle categorie di intervento.

### 7. Sicurezza e controllo degli accessi
* Gli utenti devono accedere tramite autenticazione.
* Le operazioni disponibili devono dipendere dal ruolo.
* Le credenziali e gli eventuali secret non devono essere presenti nel codice sorgente.
* Le operazioni più significative, come assegnazioni e cambi di stato, devono essere tracciabili.

### 8. Dati e integrazioni
* Archivio di edifici, aree e impianti.
* Gestione di fotografie o allegati associati alle segnalazioni.
* Predisposizione a eventuali future integrazioni con sistemi di notifica o anagrafiche aziendali.

### 9. Esercizio, monitoraggio e supporto operativo
* Il sistema deve esporre informazioni utili a verificare lo stato dell'applicazione.
* Devono essere disponibili log utili alla diagnosi dei problemi.
* Il fornitore deve predisporre istruzioni chiare per avvio, configurazione e aggiornamento dell'applicazione.

### 10. Utilizzo dell'intelligenza artificiale
NordFacility è interessata a valutare una funzione di supporto che, partendo dalla descrizione testuale di una segnalazione, possa suggerire categoria e livello di priorità. Il suggerimento dovrà essere chiaramente presentato come proposta e dovrà essere confermato o modificato da un operatore.

### 11. Vincoli e indicazioni del cliente
* Non è richiesta l'integrazione con impianti fisici reali.
* La soluzione deve poter essere eseguita in un ambiente controllato dal cliente.
* Il cliente non impone uno specifico stack tecnologico.
* Il progetto deve poter essere dimostrato utilizzando un set di dati di prova realistico.

### 12. Deliverable richiesti
1. Documento di analisi dei requisiti e casi d'uso principali.
2. Documento di architettura e motivazione delle scelte principali.
3. Applicazione funzionante con codice sorgente versionato.
4. Procedure di installazione, configurazione e avvio.
5. Documentazione delle API e principali flussi applicativi.
6. Piano essenziale dei test e risultati della verifica.
7. Breve relazione sull'eventuale utilizzo dell'AI durante sviluppo e nell'applicazione.

### 13. Criteri di accettazione
* Una segnalazione può essere inserita, assegnata, aggiornata e chiusa.
* Gli utenti vedono e modificano solo ciò che è consentito dal proprio ruolo.
* I dati rimangono disponibili dopo il riavvio dell'applicazione.
* È possibile ricostruire lo storico di almeno un intervento completo.
* Il sistema può essere avviato seguendo la documentazione consegnata.
