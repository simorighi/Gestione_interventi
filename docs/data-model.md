# Modello Dati - Sistema di Segnalazioni

## 1. Entità e Relazioni
## Finisco da chat con claude prossima volta
Abbiamo individuato due entità principali per il dominio delle segnalazioni:

*   **Segnalatore**: Rappresenta la persona che effettua la segnalazione.
    *   *Attributi*: Id (Numerico), Nome (Testo), Email (Testo).
*   **Segnalazione**: Rappresenta il problema o ticket riportato.
    *   *Attributi*: Id (Numerico), Titolo (Testo), Descrizione (Testo), Stato (Testo: es. "Aperta", "In Lavorazione", "Chiusa"), DataCreazione (Data/Ora),, priorità proposte. Poi ci sono fotografie da gestire in modo diverso con una logica. Dubbio stato magari va creata nuova entità se no va cambiato ogni volta riga.
   
*   **Luogo**
   *   *Attributi*: Id (Numerico), Nome (Testo), Via (Testo), tipo (enum: edificio,area o impianto=
*    **Intervento**
   *   *Attributi*: Id (Numerico),  Note (Testo), Descrizione (Testo)
*   **Tecnico**
  *   *Attributi*: Id (Numerico), Nome (Testo)
*   **Responsabile Manutenzione**
*   **Amministratore**

*   ** può creare *molte* **Segnalazioni** (1:N).
*   Una **Segnalazione** è creata da *un solo* **Utente** (1:1).

---

## 2. Schema Dati Minimo (SQL)

Traduzione delle entità in tabelle relazionali con vincoli di integrità.

```sql
-- Tabella Utenti
CREATE TABLE Utenti (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Nome NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE
);

-- Tabella Segnalazioni
CREATE TABLE Segnalazioni (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Titolo NVARCHAR(200) NOT NULL,
    Descrizione NVARCHAR(MAX) NOT NULL,
    Stato NVARCHAR(50) DEFAULT 'Aperta',
    DataCreazione DATETIME DEFAULT GETDATE(),
    UtenteId INT NOT NULL,
    
    -- Chiave Esterna
    CONSTRAINT FK_Segnalazioni_Utenti FOREIGN KEY (UtenteId) 
    REFERENCES Utenti(Id) ON DELETE CASCADE
);
