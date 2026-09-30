# Attori e casi d'uso — Smart Maintenance / NordFacility S.r.l.

## UN OBIETTIVO PORTATO A TERMINE DA UN ATTORE DALL'INIZIO ALLA FINE 

| | |
|---|---|
| **Team** | DreamCode, Boscaini Manuel, Cortinovis Nicola, Righi Simone, Seganti Nathan, Zamperini Raul |
| **Cliente** | NordFacility S.r.l. |
| **Data** | 23/09/2026 |
| **Versione** | v1 |

## Attori

*Un attore è un ruolo, non una persona: la stessa persona può essere due attori. Prendeteli dalla sezione "utenti e ruoli" della richiesta cliente.*

| Attore | Cosa ottiene dal sistema |
|---|---|
| **Segnalatore** | Apre le segnalazioni di guasto o anomalia e ne monitora lo stato fino alla risoluzione. |
| **Tecnico** | Visualizza gli interventi assegnati, ne aggiorna lo stato di avanzamento e inserisce le note tecniche a fine lavoro. |
| **Responsabile Manutenzione** | Supervisiona le segnalazioni, le assegna ai tecnici, ne modifica la priorità e monitora il carico di lavoro tramite dashboard. |
| **Amministratore** | Gestisce gli utenti, i ruoli, le configurazioni di sistema e i dati di base (edifici, aree, impianti). |

*(Nota: Il sistema di Intelligenza Artificiale agisce come "attore secondario" o sistema esterno che interagisce con il Segnalatore/Responsabile per suggerire categoria e priorità, ma l'attore primario che compie l'azione finale rimane l'operatore umano, in ottica human-in-the-loop).*

## Casi d'uso

*Formato minimo: attore + azione + risultato osservabile. Un caso d'uso senza attore è una funzione che nessuno ha chiesto; un attore senza casi d'uso è un ruolo inutile. Numerateli: li richiamerete nel backlog.*

### UC1 — Creazione segnalazione con supporto AI

> Il segnalatore inserisce i dati del guasto (luogo, descrizione, foto). Il sistema analizza il testo e suggerisce categoria e priorità. Il segnalatore conferma o modifica i suggerimenti e invia la richiesta.

- **Attore**: Segnalatore
- **Precondizione**: Il segnalatore è autenticato e i dati di base (edifici/impianti) sono presenti nel sistema.
- **Risultato osservabile**: La segnalazione viene salvata nel database con stato iniziale "Segnalato". Categoria e priorità sono definite e l'evento è tracciato nei log.

### UC2 — Assegnazione e ridistribuzione intervento

> Il responsabile manutenzione visualizza le segnalazioni aperte, ne valuta l'urgenza, le assegna a uno o più tecnici e, se necessario, ne modifica la priorità.

- **Attore**: Responsabile Manutenzione
- **Precondizione**: Esiste almeno una segnalazione con stato "Segnalato" o "Preso in carico".
- **Risultato osservabile**: La segnalazione risulta associata al tecnico assegnato. L'operazione di assegnazione e l'eventuale cambio di priorità vengono registrati nel log di audit.

### UC3 — Esecuzione e chiusura intervento

> Il tecnico prende in carico l'intervento, ne aggiorna lo stato (es. "In lavorazione", "Sospeso"), e al termine inserisce le note tecniche e la descrizione dell'intervento effettuato, chiudendo la segnalazione.

- **Attore**: Tecnico
- **Precondizione**: Il tecnico è autenticato e ha almeno un intervento assegnato.
- **Risultato osservabile**: Lo stato della segnalazione cambia seguendo il workflow definito (fino a "Risolto"). Le note e le foto dell'intervento sono allegate e lo storico dell'impianto viene aggiornato.

### UC4 — Supervisione e monitoraggio (Dashboard)

> Il responsabile manutenzione accede alla dashboard per avere una vista sintetica dei carichi di lavoro e filtra le segnalazioni per stato, edificio o tecnico per prendere decisioni operative.

- **Attore**: Responsabile Manutenzione
- **Precondizione**: Esistono segnalazioni nel sistema.
- **Risultato osservabile**: Il responsabile visualizza i contatori aggiornati (aperti, in lavorazione, conclusi) e può navigare l'elenco filtrato delle segnalazioni.

### UC5 — Gestione anagrafiche e configurazioni

> L'amministratore crea o modifica le anagrafiche degli edifici, delle aree e degli impianti, oppure gestisce gli accessi e i ruoli degli utenti del sistema.

- **Attore**: Amministratore
- **Precondizione**: L'utente possiede i privilegi di Amministratore.
- **Risultato osservabile**: I dati di base (edifici, aree, impianti) o gli utenti di sistema vengono creati, modificati o disabilitati. Le modifiche sono persistite e disponibili per tutti gli altri ruoli.

### UC6 — Consultazione storico e ricerca

> Un utente (segnalatore, tecnico o responsabile) cerca una segnalazione specifica o consulta lo storico degli interventi passati relativi a un determinato edificio o impianto.

- **Attore**: Segnalatore, Tecnico, Responsabile Manutenzione
- **Precondizione**: L'utente è autenticato.
- **Risultato osservabile**: Il sistema restituisce l'elenco delle segnalazioni filtrato o lo storico completo degli interventi per lo specifico impianto/edificio, permettendo la consultazione di note e allegati passati.
