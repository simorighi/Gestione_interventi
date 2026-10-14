# Modello Dati - Sistema di Segnalazioni

## 1. Entità e Relazioni
<img width="3876" height="1792" alt="diagramma_ER_smart_maintenance" src="https://github.com/user-attachments/assets/ef6b10f4-584b-4e68-9880-16a95c122916" />

---

## 2. Schema Dati Minimo 
# Modello logico relazionale

## Schema relazionale

**utente**(**id_utente**, nome, cognome, email, password_hash, attivo, data_creazione)

**ruolo**(**id_ruolo**, nome)

**utente_ruolo**(***fk_utente***, ***fk_ruolo***), con PK composta dalle due FK

**tecnico**(**id_utente**, tipo, azienda, specializzazione), dove `id_utente` è PK e allo stesso tempo FK verso utente (specializzazione ISA)

**luogo**(**id_luogo**, nome, tipo, via, citta, cap, *fk_luogo_padre*)

**categoria**(**id_categoria**, nome, descrizione, attiva)

**priorita**(**id_priorita**, nome, livello)

**stato**(**id_stato**, nome, ordine, is_finale)

**segnalazione**(**id_segnalazione**, titolo, descrizione, data_creazione, data_aggiornamento, data_chiusura, *fk_segnalatore*, *fk_luogo*, *fk_categoria*, *fk_stato*, *fk_priorita_proposta*, *fk_priorita_assegnata*)

**assegnazione**(**id_assegnazione**, data_assegnazione, *fk_segnalazione*, *fk_tecnico*, *fk_responsabile*)

**intervento**(**id_intervento**, descrizione_intervento, data_inizio, data_fine, esito, *fk_segnalazione*, *fk_tecnico*)

**nota_tecnica**(**id_nota**, testo, data_inserimento, *fk_segnalazione*, *fk_autore*, *fk_intervento*)

**allegato**(**id_allegato**, nome_file, percorso_storage, tipo_mime, dimensione, data_caricamento, *fk_segnalazione*, *fk_caricato_da*, *fk_intervento*)

**storico_stato**(**id_storico**, data_cambio, motivo, *fk_segnalazione*, *fk_stato_precedente*, *fk_stato_nuovo*, *fk_modificato_da*)

**log_audit**(**id_log**, data_ora, azione, tabella_riferita, chiave_riferita, valore_prima, valore_dopo, *fk_utente*)

**suggerimento_ai**(**id_suggerimento**, data_generazione, esito_conferma, *fk_segnalazione*, *fk_categoria_suggerita*, *fk_priorita_suggerita*, *fk_confermato_da*)




