# Domande al cliente — Smart Maintenance / NordFacility S.r.l.

| | |
|---|---|
| **Team** | *(nome team, componenti)* |
| **Cliente** | NordFacility S.r.l. |
| **Data** | 23/09/2026 |

*Ogni punto della richiesta cliente rimasto ambiguo va scritto qui come
domanda, non deciso a intuito. Ciò che resta ambiguo non è un requisito: è
una domanda da porre al cliente.*

## Domande aperte

| # | Domanda | Perché è ambigua | Impatto se cambia la risposta |
|---|---|---|---|
| 1 | Se un intervento è assegnato a più tecnici e uno solo lo segna come risolto, l'intervento si chiude per tutti o resta aperto per gli altri? | La richiesta non dice se lo stato è unico per l'intervento o individuale per ogni tecnico. | Cambia il modello dati (stato unico vs. stato per assegnazione), le regole di chiusura e le notifiche agli altri tecnici. |
| 2 | Un intervento può avere più tecnici assegnati contemporaneamente? Se sì, c'è un limite al numero e un tecnico responsabile? | La richiesta parla di "tecnici" al plurale ma non specifica se l'assegnazione multipla è prevista o se la responsabilità è condivisa. | Cambia la relazione intervento–tecnico (1 a N o N a N), i permessi e le viste di ciascun tecnico. |
| 3 | Quali configurazioni devono poter essere modificate senza intervenire sul codice sorgente (es. categorie di guasto, livelli di priorità, tempi di risposta, ruoli)? E da chi? | La richiesta indica la modificabilità senza codice ma non elenca quali parametri sono coinvolti né chi li gestisce. | Si definisce cosa va esternalizzato in file/pannello di configurazione e cosa resta fisso; incide su architettura e sul ruolo amministratore. |
| 4 | Se un segnalatore apre una richiesta, può chiedere o decidere di cambiare il tecnico assegnato (ad esempio se non è soddisfatto)? | La richiesta non dice se il segnalatore ha potere sull'assegnazione o solo sulla segnalazione. | Cambia i permessi del segnalatore, il flusso di riassegnazione e la necessità di un'approvazione da parte di un responsabile. |
| 5 | Foto e allegati: sono obbligatori o facoltativi? Quanti se ne possono caricare, di quali formati e dimensione massima? | La richiesta non specifica se le foto sono richieste, né vincoli tecnici o di quantità. | Cambia validazioni, spazio di archiviazione richiesto e campi obbligatori del modulo di segnalazione. |
| 6 | Chi può aggiungere foto e allegati (solo il segnalatore, anche i tecnici) e in quali momenti (solo all'apertura o anche durante e dopo l'intervento)? Chi può vederli? | Non è chiaro se gli allegati sono parte della segnalazione iniziale o anche della documentazione dell'intervento. | Cambia i permessi di lettura/scrittura sugli allegati e i casi d'uso di chiusura intervento (foto "prima/dopo"). |
| 7 | Chi decide la priorità finale di un intervento: il segnalatore, il responsabile o il tecnico? Il segnalatore la propone soltanto? | La richiesta parla di priorità ma non dice chi la stabilisce né se può cambiare nel tempo. | Cambia ruoli e permessi, il flusso di approvazione e l'ordinamento delle code di lavoro. |
| 8 | La priorità può essere modificata dopo la creazione della richiesta? Se sì, da chi e con quale tracciamento? | Non è specificato se la priorità è fissata all'apertura o rivedibile durante il ciclo di vita. | Cambia lo storico delle modifiche, gli eventuali ricalcoli di scadenze e le notifiche. |

## Come nascono le domande

*Ogni volta che, scrivendo `requirements.md` o `use-cases.md`, vi accorgete
di aver "riempito un vuoto" da soli — una regola non scritta, un caso limite
non previsto, un valore non specificato — fermatevi e portate il punto qui
prima di proseguire, invece di lasciarlo solo nella vostra testa.*

## Dopo la risposta

*Riguardatele prima di ogni consegna successiva: alcune verranno chiarite dal
docente nel ruolo di cliente, altre resteranno aperte finché non deciderete
voi una posizione. In quel caso, non cancellate la domanda: aggiungete la
decisione presa e la ragione, così chi legge dopo capisce cosa avete
assunto e perché.*

| # | Decisione presa (se non ancora chiarita dal cliente) | Perché |
|---|---|---|
| | | |
