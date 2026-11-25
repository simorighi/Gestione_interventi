-- C6 — Utente del database dedicato all'applicazione, con i soli privilegi necessari.
-- Oggi l'app si connette come "postgres" (amministratore): se il backend fosse
-- compromesso, chi lo controlla potrebbe cancellare tabelle e audit.
--
-- Uso (SQL editor di Supabase, come amministratore):
--   1. eseguire questo file (idempotente);
--   2. impostare la password SENZA salvarla in nessun file del repository:
--        ALTER ROLE nordfacility_app PASSWORD '<password generata, es. openssl rand -base64 32>';
--   3. mettere in DATABASE_URL (Secret Kubernetes / web/.env) l'utente nordfacility_app.
--      Con il pooler di Supabase il nome utente è "nordfacility_app.<PROJECT_REF>".
--   4. migrazioni, seed e `prisma db pull` continuano a usare l'utente amministratore.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nordfacility_app') THEN
    CREATE ROLE nordfacility_app LOGIN;
  END IF;
END $$;

-- Si parte da zero: nessun privilegio ereditato da grant precedenti.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM nordfacility_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM nordfacility_app;

GRANT USAGE ON SCHEMA public TO nordfacility_app;

-- Lettura di tutte le tabelle dell'applicazione.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nordfacility_app;

-- Scrittura solo dove l'applicazione scrive davvero. Nessun DELETE: oggi l'app
-- non cancella nulla.
GRANT INSERT, UPDATE ON segnalazione, storico_stato, assegnazione, nota_tecnica,
  allegato, intervento, suggerimento_ai TO nordfacility_app;

-- Audit: solo INSERT (e SELECT sopra). Niente UPDATE, DELETE o TRUNCATE.
GRANT INSERT ON log_audit TO nordfacility_app;

-- Le colonne id usano sequenze (autoincrement).
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO nordfacility_app;
