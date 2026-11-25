-- C6 — log_audit immutabile anche a livello di database (non solo per convenzione).
-- Il trigger blocca UPDATE e DELETE di qualsiasi riga, anche se eseguiti
-- dall'utente proprietario delle tabelle. Gli INSERT restano permessi.
-- Idempotente: si può rieseguire. Applicare dal SQL editor di Supabase.

CREATE OR REPLACE FUNCTION log_audit_immutabile() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'log_audit è immutabile: % non consentito', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_log_audit_immutabile ON log_audit;
CREATE TRIGGER trg_log_audit_immutabile
  BEFORE UPDATE OR DELETE ON log_audit
  FOR EACH ROW EXECUTE FUNCTION log_audit_immutabile();
