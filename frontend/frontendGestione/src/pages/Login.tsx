import { useState, type FormEvent } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

export function Login({ notice = '' }: { notice?: string }) {
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Accesso non riuscito.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <Card className="w-100" style={{ maxWidth: 440 }}>
        <Card.Body className="p-4">
          <h1 className="h3 mb-1">Smart Maintenance</h1>
          <p className="text-muted mb-4">Accedi per gestire le manutenzioni.</p>
          {!configured && (
            <Alert variant="warning">
              Configurazione Supabase assente. Imposta
              <code> VITE_SUPABASE_URL </code> e
              <code> VITE_SUPABASE_ANON_KEY </code> nel file
              <code> frontend/frontendGestione/.env.local </code> e riavvia Vite.
            </Alert>
          )}
          {notice && <Alert variant="warning">{notice}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={!configured || submitting}>
              {submitting && <Spinner size="sm" className="me-2" />}
              Accedi
            </Button>
          </Form>
          <small className="d-block text-muted mt-3">
            L’account deve essere creato da un amministratore in Supabase Auth
            e associato a un utente attivo dell’applicazione.
          </small>
        </Card.Body>
      </Card>
    </main>
  );
}
