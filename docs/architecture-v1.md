# Architettura v1 — Smart Maintenance / NordFacility S.r.l.

| | |
|---|---|
| **Team** | *DreamCode, Simone Righi - Manuel Boscaini - Nicola Cortinovis - Nathan Seganti - Raul Zamperini* |
| **Cliente** | *NordFacility S.r.l.* |
| **Data** | 23/09/2026 |
| **Versione** | v1 — provvisoria per definizione, la confronterete con la v2 a dicembre |

*Questo template è agnostico rispetto al linguaggio: ogni team scelto il
proprio stack (linguaggio, framework, database), qui si descrivono
componenti e responsabilità, non implementazioni.*

## Componenti

*Un componente è un pezzo che potreste rilasciare, sostituire o spegnere da
solo. Per ciascuno: una riga di responsabilità, una di non-responsabilità. Se
per descriverne uno vi serve una "e" tra due responsabilità diverse, sono
probabilmente due componenti.*

| Componente | Risponde di | Non risponde di |
|---|---|---|
| **API backend** | regole di business, validazione input, transizioni di stato, autorizzazione per ruolo, storico dei cambi di stato, documentazione OpenAPI | come i dati appaiono a schermo; come e dove sono memorizzati i dati |
| **Database** | persistenza e integrità dei dati (segnalazioni, utenti, ruoli, anagrafiche, storico), schema e dati di seed | qualsiasi regola di business o permesso |
| **Frontend**  | presentazione, navigazione e raccolta dell'input dell'utente | regole di business, autorizzazione, interazione |
## Diagramma

*Scatole = componenti, frecce = "chiama"/"dipende da" con sopra cosa passa
(es. HTTPS/JSON, SQL, file). Segnate cosa è dentro il vostro perimetro e cosa
è fuori (servizi di terzi, sistemi del cliente). Ciò che è previsto ma non
ancora realizzato si disegna tratteggiato. Va bene un blocco Mermaid come
questo, un disegno fotografato, o qualunque notazione capiate a colpo
d'occhio come team — l'importante è che le frecce siano etichettate.*


```mermaid
flowchart LR
  Utente([Utente])

  subgraph Perimetro["Perimetro DreamCode"]
    Frontend["Frontend (previsto)"]
    API[API backend]
    DB[(Database)]
  end

  subgraph Fuori["Fuori dal perimetro"]
    Notifiche["Sistema di notifiche aziendali (futuro)"]
  end

  Utente -.->|HTTPS| Frontend
  Frontend -.->|HTTPS/JSON| API
  Utente -->|HTTPS/JSON, oggi via client API| API
  API -->|SQL| DB
  API -.->|previsto: eventi di notifica| Notifiche
```


## Dipendenze

*Elenco esplicito: chi dipende da chi, e cosa succede se il componente da cui
si dipende si ferma o risponde male.*

| Componente | Dipende da | Se si ferma |
|---|---|---|
| **Frontend** | **API backend** | **l'utente vede errori e non sta salvando nulla di quello che sta facendo** |
|**API backend**|**Database** | **Se backend non si collega a database l'utente non riuscirà a vedere nessun dato** |

## Fuori dal perimetro

*Cosa esiste ma non lo costruite voi: sistemi del cliente, servizi esterni,
integrazioni future dichiarate nella richiesta.*

- integrazione con sistemi di intelligenza artificiale
