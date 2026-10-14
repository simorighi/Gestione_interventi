# Modello Dati - Sistema di Segnalazioni

## 1. Entità e Relazioni
<img width="3876" height="1792" alt="diagramma_ER_smart_maintenance" src="https://github.com/user-attachments/assets/ef6b10f4-584b-4e68-9880-16a95c122916" />

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
